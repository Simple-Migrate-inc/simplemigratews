import { execSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// Vercel's file system is case-sensitive; macOS usually isn't. A path like
// "/videos/x.mp4" pointing at "public/Videos/x.mp4" works locally but 404s in
// production. This test compares every referenced asset with the exact file
// names in git.

const ASSET_REF = /["'(]((?:\/images|\/videos|\/fonts|\/icons)\/[^"')\s?#]+)/gi;

function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.(tsx|ts|json|md|css)$/.test(name) && !name.endsWith(".test.ts")) out.push(p);
    }
    return out;
}

describe("public asset references", () => {
    it("match a committed file with the exact same case", () => {
        const committed = new Set(
            execSync("git ls-files public", { encoding: "utf8" })
                .split("\n")
                .filter(Boolean)
                .map((f) => f.slice("public".length))
        );
        const problems: string[] = [];
        for (const file of walk("src")) {
            const text = readFileSync(file, "utf8");
            for (const m of text.matchAll(ASSET_REF)) {
                const ref = m[1];
                // Skip references inside commented-out lines.
                const line = text.slice(text.lastIndexOf("\n", m.index) + 1, m.index);
                if (/^\s*(\/\/|\*)/.test(line)) continue;
                if (!committed.has(ref)) problems.push(`${ref} (in ${file})`);
            }
        }
        expect(problems).toEqual([]);
    });
});
