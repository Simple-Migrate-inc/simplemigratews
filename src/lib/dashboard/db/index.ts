import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { dashDb?: Db };

function create(): Db {
    const client = postgres(env().DATABASE_URL, { max: 5, prepare: false });
    return drizzle(client, { schema, casing: undefined });
}

export function db(): Db {
    if (!globalForDb.dashDb) globalForDb.dashDb = create();
    return globalForDb.dashDb;
}

export { schema };
