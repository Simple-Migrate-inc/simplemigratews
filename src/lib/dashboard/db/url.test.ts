import { describe, expect, it } from "vitest";
import { appDatabaseUrl, cleanPostgresUrl, directDatabaseUrl } from "./url";

const POOLED = "postgres://postgres.abc:pw@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const DIRECT = "postgres://postgres.abc:pw@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require";

describe("database URL resolution", () => {
    it("strips parameters postgres.js would send to the server, keeps sslmode", () => {
        const u = new URL(cleanPostgresUrl(POOLED));
        expect(u.searchParams.get("sslmode")).toBe("require");
        expect(u.searchParams.has("supa")).toBe(false);
        expect(u.port).toBe("6543");
    });

    it("prefers our own names, then the Supabase integration's names", () => {
        expect(appDatabaseUrl({ DATABASE_URL: "postgres://localhost/a" })).toBe("postgres://localhost/a");
        expect(appDatabaseUrl({ POSTGRES_URL: POOLED })).toContain(":6543/");
        expect(directDatabaseUrl({ POSTGRES_URL: POOLED, POSTGRES_URL_NON_POOLING: DIRECT })).toContain(":5432/");
        expect(directDatabaseUrl({ DATABASE_URL: "postgres://localhost/a" })).toBe("postgres://localhost/a");
        expect(appDatabaseUrl({})).toBeUndefined();
    });
});
