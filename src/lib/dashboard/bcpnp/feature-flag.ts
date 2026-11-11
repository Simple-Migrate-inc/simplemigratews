import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";

/** Returns true when the bcpnp_cases feature flag is enabled in the database. */
export async function isBcpnpEnabled(): Promise<boolean> {
    const [row] = await db()
        .select({ enabled: schema.featureFlag.enabled })
        .from(schema.featureFlag)
        .where(eq(schema.featureFlag.key, "bcpnp_cases"))
        .limit(1);
    return row?.enabled ?? false;
}

/**
 * Throws a redirect to the caller's home page when bcpnp_cases is off.
 * Use at the top of every BC PNP page and server action.
 */
export async function requireBcpnp(redirectTo = "/app"): Promise<void> {
    const { redirect } = await import("next/navigation");
    const enabled = await isBcpnpEnabled();
    if (!enabled) redirect(redirectTo);
}
