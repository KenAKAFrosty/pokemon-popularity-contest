import { component$ } from '@builder.io/qwik';
import { DocumentHead, server$ } from '@builder.io/qwik-city';
import { DatabaseTable } from '~/database/query-builder';

const test = server$(()=> { 

})

export default component$(() => {
  return (<main>
    <h1>Pokémon Popularity Contest</h1>
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
