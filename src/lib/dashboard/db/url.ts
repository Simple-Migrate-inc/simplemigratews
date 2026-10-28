/**
 * Database URL resolution shared by the app, migrations and scripts.
 * Dependency-free so plain Node scripts can import it.
 *
 * Accepts our own names (DATABASE_URL / DIRECT_URL) or the names the Vercel
 * Supabase integration provisions (POSTGRES_URL / POSTGRES_URL_NON_POOLING).
 */
type Env = Record<string, string | undefined>;

// Query parameters postgres.js understands. Anything else (e.g. Supabase's
// "supa" or "pgbouncer" hints) would be sent to the server as a runtime
// parameter and rejected, so it is stripped.
const KEEP_PARAMS = new Set(["sslmode", "connect_timeout", "application_name"]);

export function cleanPostgresUrl(raw: string): string {
    const url = new URL(raw);
    for (const key of Array.from(url.searchParams.keys())) {
        if (!KEEP_PARAMS.has(key)) url.searchParams.delete(key);
    }
    return url.toString();
}

/** Pooled URL for the running app. */
export function appDatabaseUrl(env: Env = process.env): string | undefined {
    const raw = env.DATABASE_URL || env.POSTGRES_URL;
    return raw ? cleanPostgresUrl(raw) : undefined;
}

/** Direct (non-pooled) URL for migrations and scripts; falls back to the app URL. */
export function directDatabaseUrl(env: Env = process.env): string | undefined {
    const raw = env.DIRECT_URL || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL || env.POSTGRES_URL;
    return raw ? cleanPostgresUrl(raw) : undefined;
}
