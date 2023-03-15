import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Test {
  id: number | null;
  name: string | null;
}

export interface Users {
  id: Generated<number>;
  phone_number: string;
  auth_token: Generated<string>;
}

export interface DB {
  test: Test;
  users: Users;
}
