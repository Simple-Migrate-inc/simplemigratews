import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3100);

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [["list"]],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: "retain-on-failure",
    },
    expect: {
        toHaveScreenshot: { maxDiffPixels: 0, animations: "disabled" },
    },
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"] } },
        // Dashboard flows mutate the test DB, so they run once (desktop) plus a
        // read-only mobile layout check.
        { name: "mobile", use: { ...devices["Pixel 5"] }, testMatch: /(public-visual|dashboard-mobile)\.spec\.ts/ },
    ],
    globalSetup: "./e2e/global-setup.ts",
    webServer: {
        command: `npx next start -p ${PORT}`,
        env: {
            DATABASE_URL: process.env.E2E_DATABASE_URL || "postgres://localhost:5432/simplemigrate_test",
            APP_BASE_URL: `http://localhost:${PORT}`,
            // The suite signs in many times a minute from one IP.
            AUTH_SIGNIN_RATE_LIMIT: "200",
            EMAIL_DRIVER: "log",
        },
        port: PORT,
        // Always start fresh so the server uses the test database.
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
