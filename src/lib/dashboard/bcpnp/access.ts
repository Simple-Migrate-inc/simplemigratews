import "server-only";
import { and, eq, or } from "drizzle-orm";
import { db, schema, bcpnpSchema } from "../db";
import { audit } from "../audit";
import type { CurrentUser } from "../auth/session";

export type BcpnpCaseAccess =
    | { kind: "owner" }
    | { kind: "superuser" }
    | { kind: "consultant" };

/**
 * Load a BC PNP case for the current user, enforcing access, and write an
 * audit event. Returns null when the user has no access.
 *
 * Access rules:
 *   superuser → any case
 *   admin     → any case (staff fallback)
 *   consultant → only cases where consultant_id = user.id
 *   candidate  → only their own case (applicant_id = user.id)
 */
export async function openBcpnpCase(
    user: CurrentUser,
    caseId: string,
    action = "bcpnp_case.view"
): Promise<{
    case: typeof bcpnpSchema.bcpnpCase.$inferSelect;
    access: BcpnpCaseAccess;
} | null> {
    const [c] = await db()
        .select()
        .from(bcpnpSchema.bcpnpCase)
        .where(eq(bcpnpSchema.bcpnpCase.id, caseId))
        .limit(1);

    if (!c) return null;

    let access: BcpnpCaseAccess | null = null;

    switch (user.role) {
        case "superuser":
            access = { kind: "superuser" };
            break;
        case "admin":
            access = { kind: "superuser" };
            break;
        case "consultant":
            access = c.consultantId === user.id ? { kind: "consultant" } : null;
            break;
        case "candidate":
            access = c.applicantId === user.id ? { kind: "owner" } : null;
            break;
        default:
            access = null;
    }

    await audit({
        actorId: user.id,
        action: access ? action : `${action}.denied`,
        objectType: "bcpnp_case",
        objectId: caseId,
        caseId,
    });

    return access ? { case: c, access } : null;
}

/** Returns all active BC PNP cases for the pipeline view (superuser/admin only). */
export async function listBcpnpCases(user: CurrentUser) {
    if (user.role !== "superuser" && user.role !== "admin") return [];

    return db()
        .select({
            id: bcpnpSchema.bcpnpCase.id,
            applicantId: bcpnpSchema.bcpnpCase.applicantId,
            stream: bcpnpSchema.bcpnpCase.stream,
            stage: bcpnpSchema.bcpnpCase.stage,
            status: bcpnpSchema.bcpnpCase.status,
            openedAt: bcpnpSchema.bcpnpCase.openedAt,
            applicantName: schema.user.name,
            applicantEmail: schema.user.email,
        })
        .from(bcpnpSchema.bcpnpCase)
        .leftJoin(schema.user, eq(bcpnpSchema.bcpnpCase.applicantId, schema.user.id))
        .orderBy(bcpnpSchema.bcpnpCase.openedAt);
}

/** Returns all active BC PNP cases assigned to a consultant. */
export async function listConsultantBcpnpCases(user: CurrentUser) {
    if (user.role !== "consultant") return [];

    return db()
        .select({
            id: bcpnpSchema.bcpnpCase.id,
            applicantId: bcpnpSchema.bcpnpCase.applicantId,
            stream: bcpnpSchema.bcpnpCase.stream,
            stage: bcpnpSchema.bcpnpCase.stage,
            status: bcpnpSchema.bcpnpCase.status,
            openedAt: bcpnpSchema.bcpnpCase.openedAt,
            applicantName: schema.user.name,
        })
        .from(bcpnpSchema.bcpnpCase)
        .leftJoin(schema.user, eq(bcpnpSchema.bcpnpCase.applicantId, schema.user.id))
        .where(
            and(
                eq(bcpnpSchema.bcpnpCase.consultantId, user.id),
                or(
                    eq(bcpnpSchema.bcpnpCase.status, "active"),
                    eq(bcpnpSchema.bcpnpCase.status, "nominated")
                )
            )
        )
        .orderBy(bcpnpSchema.bcpnpCase.openedAt);
}
