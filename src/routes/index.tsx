import { component$ } from '@builder.io/qwik';
import { DocumentHead, server$ } from '@builder.io/qwik-city';
import { getQueryBuilder } from '~/database/query-builder';

const getFirstUser = server$(async () => {
  const qb = getQueryBuilder();
  const user = await qb.selectFrom("users").selectAll().executeTakeFirst();
  console.log(user);
})

export default component$(() => {
  return (<main>
    <h1>Pokémon Popularity Contest</h1>
    <button
      onClick$={() => {
        getFirstUser();
      }}
    >Click me to run server code!</button>
  </main>);
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
