

import { component$, useSignal } from '@builder.io/qwik';
import { DocumentHead, routeLoader$, server$ } from '@builder.io/qwik-city';
import { getQueryBuilder } from '~/database/query-builder';
import { getUuId } from '~/generic-utilities';
import { getPokemon, getRandomPokemonId } from '~/pokeapi/pokemon';
import { checkToken, sendToken } from '~/twilio/verification';
const testPhoneNumber = import.meta.env.VITE_TEST_PHONE_NUMBER;

export const useCurrentUser = routeLoader$(async (context) => {
  const auth_token = context.cookie.get("auth_token");
  if (!auth_token) {
    return null
  }
  const qb = getQueryBuilder()
  const user = await qb.selectFrom("users").selectAll()
    .where("auth_token", "=", auth_token.value)
    .executeTakeFirst();
  return user || null;
});

export const useTwoRandomPokemon = routeLoader$(async (context) => {
  const user = await context.resolveValue(useCurrentUser);
  if (!user) {
    return null;
  } else {
    const idOne = getRandomPokemonId();
    const idTwo = getRandomPokemonId();
    const pokemonResponses = await Promise.all([
      getPokemon(idOne),
      getPokemon(idTwo)
    ]);
    const pokemon = pokemonResponses.map(pokemonResponse => {
      if (!pokemonResponse.success) {
        throw new Error("Failed to get pokemon. Unexpected behavior")
      }
      return {
        name: pokemonResponse.pokemon.name,
        image: pokemonResponse.pokemon.sprites.front_default
      }
    });
    return pokemon;
  }

})


export default component$(() => {
  const currentUser = useCurrentUser();
  const pokemon = useTwoRandomPokemon();
  if (pokemon.value === null) {
    throw new Error("Pokemon is null")
  }
  console.log(currentUser.value)

  return (<main>
    <h1>Pokémon Popularity Contest</h1>
    {
      currentUser.value ?
        <h2>Logged in.</h2>
        : <h2>Not logged in</h2>
    }
    {currentUser.value ? <PokemonPicker pokemon={pokemon.value} /> : <Login />}
  </main>);
});



export const PokemonPicker = component$((props: {
  pokemon: { name: string, image: string | null }[]
}) => {
  const pokemonOneSignal = useSignal(props.pokemon[0]);
  const pokemonTwoSignal = useSignal(props.pokemon[1]);
  return <section>
    <h2>Which Pokémon is more popular?</h2>
    <div>
      <img src={pokemonOneSignal.value.image || undefined} />
      <p>{pokemonOneSignal.value.name}</p>
    </div>
    <div>
      <img src={pokemonTwoSignal.value.image || undefined} />
      <p>{pokemonTwoSignal.value.name}</p>
    </div>
  </section>
})



export const Login = component$(() => {
  const phoneNumberSignal = useSignal("");
  const codeSignal = useSignal("");
  return <section>
    <p>phone number</p>
    <input
      value={phoneNumberSignal.value}
      onChange$={event => {
        phoneNumberSignal.value = event.target.value;
      }} />
    <button
      onClick$={async () => {
        const result = await frontendSendToken(phoneNumberSignal.value);
        console.log(result)
      }}
    >
      Send token
    </button>

    <p>verify token</p>
    <input
      value={codeSignal.value}
      onChange$={event => {
        codeSignal.value = event.target.value;
      }}
    />
    <button
      onClick$={async () => {
        const result = await verifyUser({ code: codeSignal.value, phoneNumber: phoneNumberSignal.value });
        if (result.success) {
          window.location.reload();
        } else {
          //TODO: communicate error to user
        }
      }}
    >
      Verify
    </button>
  </section>
});



export const frontendSendToken = server$(async (phoneNumber: string) => {
  const phoneNumberToUse = phoneNumber === "test" ? testPhoneNumber : phoneNumber;
  return sendToken(phoneNumberToUse);
});

export const verifyUser = server$(async function (inputs: { code: string, phoneNumber: string }) {
  const { phoneNumber, code } = inputs;
  const phoneNumberToUse = phoneNumber === "test" ? testPhoneNumber : phoneNumber;
  const result = await checkToken({
    code,
    phoneNumber: phoneNumberToUse
  });
  if (result.status === "approved") {
    const token = getUuId();
    const qb = getQueryBuilder();
    const existingUser = await qb.selectFrom("users")
      .selectAll()
      .where("phone_number", "=", phoneNumberToUse)
      .executeTakeFirst();
    if (existingUser) {
      await qb.updateTable("users")
        .set({ auth_token: token })
        .where("phone_number", "=", phoneNumberToUse)
        .execute();
    } else {
      await qb.insertInto("users")
        .values({
          phone_number: phoneNumberToUse,
          auth_token: token
        })
        .execute();
    }

    this.cookie.set("auth_token", token, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      path: "/",
      secure: true
    })
    return { success: true as const }
  } else {
    return { success: false as const, message: "Code was not approved" as const }
  }
});


export const head: DocumentHead = {
  title: 'Pokémon Popularity Contest',
  meta: [
    {
      name: 'description',
      content: 'Speedran live on Twitch',
    },
  ],
};
