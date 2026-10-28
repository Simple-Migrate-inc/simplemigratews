import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { directDatabaseUrl } from "./src/lib/dashboard/db/url";

config({ path: [".env.local", ".env"] });

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/lib/dashboard/db/schema.ts",
    out: "./src/lib/dashboard/db/migrations",
    // Only ever introspect/diff the dashboard schema; never touch anything else.
    schemaFilter: ["dashboard"],
    dbCredentials: {
        url: directDatabaseUrl() || "",
    },
    strict: true,
    verbose: true,
});
