import { z } from "zod";
import { appDatabaseUrl } from "./db/url";

// Server-only environment for the dashboard. Parsed lazily so public pages
// never depend on dashboard configuration at build time.

const bool = (fallback: boolean) =>
    z
        .enum(["true", "false", "1", "0"])
        .optional()
        .transform((v) => (v === undefined ? fallback : v === "true" || v === "1"));

const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    // Public origin of the app. Optional on Vercel: see resolveBaseUrl().
    APP_BASE_URL: z.string().url().default("http://localhost:3000"),

    // Email: "resend" sends via Resend; "log" only prints to the server log
    // (local/testing). Defaults to resend when RESEND_API_KEY is set.
    EMAIL_DRIVER: z.enum(["resend", "log"]).optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("Simple Migrate <no-reply@simplemigrate.com>"),

    // Storage: "local" writes to .dashboard-uploads/ (dev only); "s3" uses S3_*.
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    S3_REGION: z.string().default("ca-central-1"),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),

    ANTHROPIC_API_KEY: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    DDF_USERNAME: z.string().optional(),
    DDF_PASSWORD: z.string().optional(),
    MAPBOX_TOKEN: z.string().optional(),

    FEATURE_DDF: bool(false),
    FEATURE_AGENT_REFERRAL_FEES: bool(false),
    FEATURE_AI: bool(false),

    // Sign-in attempts per IP per minute (lower = stricter). Tests raise it.
    AUTH_SIGNIN_RATE_LIMIT: z.coerce.number().int().positive().default(5),

    // Development convenience only; ignored when NODE_ENV=production.
    DASH_DEV_SKIP_MFA: bool(false),
});

export type DashboardEnv = z.infer<typeof schema>;

/**
 * On Vercel, derive the app origin when APP_BASE_URL isn't set: previews use
 * their branch URL, production uses the project's production domain (which
 * becomes the custom domain automatically once one is assigned).
 */
function resolveBaseUrl(e: NodeJS.ProcessEnv): string | undefined {
    if (e.APP_BASE_URL) return e.APP_BASE_URL;
    if (e.VERCEL_ENV === "production" && e.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${e.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    const host = e.VERCEL_BRANCH_URL || e.VERCEL_URL;
    return host ? `https://${host}` : undefined;
}

/** Every origin this deployment may legitimately be reached on (for CSRF checks). */
export function trustedOrigins(): string[] {
    const e = process.env;
    const hosts = [e.VERCEL_URL, e.VERCEL_BRANCH_URL, e.VERCEL_PROJECT_PRODUCTION_URL].filter(
        (h): h is string => !!h
    );
    return Array.from(new Set([env().APP_BASE_URL, ...hosts.map((h) => `https://${h}`)]));
}

let cached: DashboardEnv | undefined;

export function env(): DashboardEnv {
    if (!cached) {
        const parsed = schema.safeParse({
            ...process.env,
            DATABASE_URL: appDatabaseUrl(),
            APP_BASE_URL: resolveBaseUrl(process.env),
        });
        if (!parsed.success) {
            const issues = parsed.error.issues
                .map((i) => `  ${i.path.join(".")}: ${i.message}`)
                .join("\n");
            throw new Error(`Invalid dashboard environment:\n${issues}`);
        }
        cached = parsed.data;
    }
    return cached;
}

export function emailDriver(): "resend" | "log" {
    const e = env();
    if (e.EMAIL_DRIVER) return e.EMAIL_DRIVER;
    if (e.RESEND_API_KEY) return "resend";
    if (e.NODE_ENV === "production") {
        throw new Error("Set RESEND_API_KEY (or EMAIL_DRIVER=log for a non-public test server)");
    }
    return "log";
}

export function mfaRequiredInThisEnv(): boolean {
    const e = env();
    return e.NODE_ENV === "production" || !e.DASH_DEV_SKIP_MFA;
}
