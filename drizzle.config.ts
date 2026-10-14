import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/lib/dashboard/db/schema.ts",
    out: "./src/lib/dashboard/db/migrations",
    // Only ever introspect/diff the dashboard schema; never touch anything else.
    schemaFilter: ["dashboard"],
    dbCredentials: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
    },
    strict: true,
    verbose: true,
});
