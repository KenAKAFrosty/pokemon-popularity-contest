

import { component$, useSignal, useStylesScoped$, useTask$ } from '@builder.io/qwik';
import { DocumentHead, routeLoader$, server$ } from '@builder.io/qwik-city';
import { sql } from 'kysely';
import { DatabaseTable, getQueryBuilder } from '~/database/query-builder';
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

export const useSelections = routeLoader$(async (context) => {

  const qb = getQueryBuilder()
  const selections = await qb.selectFrom("selections")
    .select(sql<number>`COUNT(*)`.as("count"))
    .select("selectionName")
    .groupBy("selectionName")
    .orderBy("count", "desc")
    .execute();
  return selections;

})

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
        image: pokemonResponse.pokemon.sprites.front_default,
        id: pokemonResponse.pokemon.id
      }
    });
    return pokemon;
  }

})


export default component$(() => {
  const currentUser = useCurrentUser();
  const pokemon = useTwoRandomPokemon();
  const selections = useSelections();
  if (currentUser.value && pokemon.value === null) {
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
    {currentUser.value ? <PokemonPicker pokemon={pokemon.value!} /> : <Login />}
    <PopularityResults selections={selections.value} />
  </main>);
});

export const PopularityResults = component$((props: {
  selections: (Pick<DatabaseTable<"selections">, "selectionName"> & { count: number })[]
}) => {
  return <>
    <h2>Results</h2>
    {props.selections.map(selection => {
      return <div>{selection.selectionName} - {selection.count}</div>
    })}
  </>
})


export const submitSelection = server$(async function (inputs: {
  selection: PokemonDisplay,
  option1: PokemonDisplay,
  option2: PokemonDisplay,
}) {
  console.log('starting server side submission')
  const auth_token = this.cookie.get("auth_token");
  if (!auth_token) {
    throw new Error("No auth token provided")
  }
  const qb = getQueryBuilder()
  const user = await qb.selectFrom("users").selectAll()
    .where("auth_token", "=", auth_token.value)
    .executeTakeFirst();
  if (!user) {
    throw new Error("User not found from auth token provided")
  }

  const { selection, option1, option2 } = inputs;
  if (selection.id !== option1.id && selection.id !== option2.id) {
    throw new Error("Selection is not one of the options")
  }

  const [pokemonResponseOne, pokemonResponseTwo] = await Promise.all([
    getPokemon(option1.id),
    getPokemon(option2.id)
  ]);
  if (!pokemonResponseOne.success || !pokemonResponseTwo.success) {
    throw new Error("Failed to get pokemon. Unexpected behavior")
  }
  if (
    pokemonResponseOne.pokemon.name !== option1.name ||
    pokemonResponseTwo.pokemon.name !== option2.name) {
    throw new Error("Pokemon name provided does not match true name for id")
  }

  const insertResult = await qb.insertInto("selections").values({
    optionOneName: option1.name,
    optionTwoName: option2.name,
    selectionName: selection.name,
    userId: user.id
  }).executeTakeFirst();

  return Number(insertResult.insertId)
})


type PokemonDisplay = { name: string, image: string | null, id: number }
export const PokemonPicker = component$((props: {
  pokemon: PokemonDisplay[]
}) => {
  const pokemonOneSignal = useSignal(props.pokemon[0]);
  const pokemonTwoSignal = useSignal(props.pokemon[1]);
  const selectionSignal = useSignal<PokemonDisplay | null>(null);
  useTask$(async ({ track }) => {
    const selection = track(() => selectionSignal.value);
    if (!selection) {
      return;
    }
    console.log('starting client side submission')
    const result = await submitSelection({
      option1: pokemonOneSignal.value,
      option2: pokemonTwoSignal.value,
      selection: pokemonOneSignal.value
    });
    console.log(result);
    window.location.reload();
  })

  useStylesScoped$(`
    div { 
      cursor: pointer;
      margin: 2rem;
      width: fit-content;
    }
  `)
  return <section>
    <h2>Which Pokémon do you like more?</h2>

    <div onClick$={() => { selectionSignal.value = pokemonOneSignal.value }}>
      <img src={pokemonOneSignal.value.image || undefined} />
      <p>{pokemonOneSignal.value.name}</p>
    </div>

    <div onClick$={() => { selectionSignal.value = pokemonTwoSignal.value }}>
      <img src={pokemonTwoSignal.value.image || undefined} />
      <p>{pokemonTwoSignal.value.name}</p>
    </div>

  </section>
});



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
