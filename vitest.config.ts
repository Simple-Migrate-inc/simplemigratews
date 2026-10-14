import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        environment: "node",
    },
    resolve: {
        alias: {
            "@dashboard": path.resolve(__dirname, "src/lib/dashboard"),
        },
    },
});
