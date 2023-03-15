import { type ColumnType, Kysely } from "kysely"
import { PlanetScaleDialect } from "kysely-planetscale"
import { DB } from "./introspected-types"

const qb = new Kysely<DB>({
    dialect: new PlanetScaleDialect({
        host: import.meta.env.VITE_DATABASE_HOST || process.env.VITE_DATABASE_HOST,
        username: import.meta.env.VITE_DATABASE_USERNAME || process.env.VITE_DATABASE_USERNAME,
        password: import.meta.env.VITE_DATABASE_PASSWORD || process.env.VITE_DATABASE_PASSWORD,
    }),
})

export function getQueryBuilder() {
    return qb
}

type extractTypeFromColumn<Type> = Type extends ColumnType<infer X> ? extractTypeFromColumn<X> : Type
export type DatabaseTable<TableName extends keyof DB, Table = DB[TableName]> = { [Property in keyof Table]: extractTypeFromColumn<Table[Property]> }