/**
 * LOCAL ONLY: drops the `dashboard` schema (nothing else) and re-runs
 * migrations. Refuses to run against any non-localhost database.
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"] });

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const host = new URL(url).hostname;
    if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1"].includes(host)) {
        throw new Error(`Refusing to reset a non-local database (${host}).`);
    }
    const sql = postgres(url, { max: 1, onnotice: () => {} });
    await sql`DROP SCHEMA IF EXISTS dashboard CASCADE`;
    await sql.end();
    console.log("Dropped local dashboard schema.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
