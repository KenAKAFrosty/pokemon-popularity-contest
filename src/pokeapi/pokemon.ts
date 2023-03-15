const MIN_POKEMON_ID = 1;
const MAX_POKEMON_ID = 1010;

export function getRandomPokemonId() {
    return Math.floor(Math.random() * (MAX_POKEMON_ID - MIN_POKEMON_ID) + MIN_POKEMON_ID);
}

interface Pokemon {
    name: string;
    id: number;
    sprites: {
        back_default: string | null
        back_female: string | null
        back_shiny: string | null
        back_shiny_female: string | null
        front_default: string | null
        front_female: string | null
        front_shiny: string | null
        front_shiny_female: string | null
    }
}

export async function getPokemon(id: number) {
    if (id < MIN_POKEMON_ID || id > MAX_POKEMON_ID) {
        return {
            success: false as const,
            error: "Invalid Pokemon ID" as const
        }
    }
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const pokemon = await fetch(url).then(raw => raw.json());
    return {
        success: true as const,
        pokemon: pokemon as Pokemon
    }
}