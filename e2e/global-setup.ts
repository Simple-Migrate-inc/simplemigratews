import { execSync } from "child_process";

export const TEST_DB = process.env.E2E_DATABASE_URL || "postgres://localhost:5432/simplemigrate_test";

// Fresh dashboard schema + seed in the dedicated test database before each run.
export default function globalSetup() {
    execSync("npm run -s db:reset", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: TEST_DB, DIRECT_URL: TEST_DB },
    });
}
