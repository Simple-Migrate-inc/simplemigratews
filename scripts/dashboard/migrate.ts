/**
 * Applies pending dashboard migrations. Run explicitly (`npm run db:migrate`)
 * — migrations never run automatically on deploy.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { directDatabaseUrl } from "../../src/lib/dashboard/db/url";

config({ path: [".env.local", ".env"] });

async function main() {
    const url = directDatabaseUrl();
    if (!url) throw new Error("DATABASE_URL (or POSTGRES_URL) is not set");
    const client = postgres(url, { max: 1 });
    await migrate(drizzle(client), {
        migrationsFolder: "src/lib/dashboard/db/migrations",
        migrationsSchema: "dashboard",
        migrationsTable: "__migrations",
    });
    await client.end();
    console.log("Dashboard migrations applied.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
