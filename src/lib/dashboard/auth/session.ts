import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "./auth";
import { db, schema } from "../db";
import { mfaRequiredInThisEnv } from "../env";
import type { UserRole } from "../db/schema";
import { REQUIRED_CONSENTS } from "./legal";
import { ROLE_HOME, canEnterArea, requiresMfa } from "./roles";

export type CurrentUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: "active" | "suspended" | "deactivated";
    twoFactorEnabled: boolean;
    licenceNumber: string | null;
    licenceBody: string | null;
    licenceVerifiedAt: Date | null;
};

/**
 * The signed-in user, read fresh from the database on every request (role
 * and status are never trusted from the cookie). Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const s = await auth().api.getSession({ headers: headers() });
    if (!s) return null;
    const [u] = await db()
        .select({
            id: schema.user.id,
            name: schema.user.name,
            email: schema.user.email,
            role: schema.user.role,
            status: schema.user.status,
            twoFactorEnabled: schema.user.twoFactorEnabled,
            licenceNumber: schema.user.licenceNumber,
            licenceBody: schema.user.licenceBody,
            licenceVerifiedAt: schema.user.licenceVerifiedAt,
        })
        .from(schema.user)
        .where(eq(schema.user.id, s.user.id))
        .limit(1);
    return u ?? null;
});

export async function missingConsents(userId: string) {
    const rows = await db()
        .select({ kind: schema.consentRecord.kind, version: schema.consentRecord.version })
        .from(schema.consentRecord)
        .where(
            and(
                eq(schema.consentRecord.userId, userId),
                inArray(
                    schema.consentRecord.kind,
                    REQUIRED_CONSENTS.map((c) => c.kind)
                )
            )
        );
    return REQUIRED_CONSENTS.filter(
        (c) => !rows.some((r) => r.kind === c.kind && r.version === c.version)
    );
}

type RequireOptions = {
    /** Role area being opened; admins may open any area. */
    area?: UserRole;
    /** Skip the MFA-enrolment and consent gates (used by those pages). */
    skipGates?: boolean;
};

/** Gate for every dashboard page and server action. */
export async function requireUser(opts: RequireOptions = {}): Promise<CurrentUser> {
    const u = await getCurrentUser();
    if (!u) redirect("/app/login");
    if (u.status !== "active") redirect("/app/login?error=inactive");

    if (!opts.skipGates) {
        if (requiresMfa(u.role) && !u.twoFactorEnabled && mfaRequiredInThisEnv()) {
            redirect("/app/setup-mfa");
        }
        if ((await missingConsents(u.id)).length > 0) redirect("/app/consent");
    }

    if (opts.area && !canEnterArea(u.role, opts.area)) redirect(ROLE_HOME[u.role]);
    return u;
}
