import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, schema, bcpnpSchema } from "../db";
import { audit } from "../audit";
import type { CurrentUser } from "../auth/session";
import { buildPartnerActor } from "../../pnp/permissions";
import type { PnpActor } from "../../pnp/permissions";

export type BcpnpCaseAccess =
    | { kind: "owner" }
    | { kind: "superuser" }
    | { kind: "consultant" }
    | { kind: "partner"; actor: PnpActor };

/**
 * Load a BC PNP case for the current user, enforce access, and write an audit
 * event. Returns null when the user has no access.
 *
 * For partner users the returned access.actor is pre-populated with their tier,
 * section grants and consent state for this specific file — pass it to can()
 * on every subsequent permission check without hitting the DB again.
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
        case "admin":
            access = { kind: "superuser" };
            break;

        case "consultant":
            access = c.consultantId === user.id ? { kind: "consultant" } : null;
            break;

        case "candidate":
            access = c.applicantId === user.id ? { kind: "owner" } : null;
            break;

        case "partner": {
            const partnerAccess = await resolvePartnerAccess(user.id, caseId);
            access = partnerAccess
                ? { kind: "partner", actor: partnerAccess }
                : null;
            break;
        }

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

/**
 * Build a PnpActor for a partner user on a specific file.
 * Returns null when no active member record exists for this user.
 * Note: MK-tier members may access their sourced leads without an assignment row;
 * for them we return an actor with assignmentActive=false (the can() helper
 * handles the MK-specific cases that don't require an assignment).
 */
async function resolvePartnerAccess(
    userId: string,
    fileId: string
): Promise<PnpActor | null> {
    // 1. Find the user's partner member record
    const [member] = await db()
        .select({
            id: bcpnpSchema.bcpnpPartnerMember.id,
            tier: bcpnpSchema.bcpnpPartnerMember.tier,
            orgId: bcpnpSchema.bcpnpPartnerMember.orgId,
            active: bcpnpSchema.bcpnpPartnerMember.active,
        })
        .from(bcpnpSchema.bcpnpPartnerMember)
        .where(
            and(
                eq(bcpnpSchema.bcpnpPartnerMember.userId, userId),
                eq(bcpnpSchema.bcpnpPartnerMember.active, true)
            )
        )
        .limit(1);

    if (!member) return null;

    // 2. Find an active assignment for this file
    const [assignment] = await db()
        .select({
            sectionGrants: bcpnpSchema.bcpnpAssignment.sectionGrants,
            expiresAt: bcpnpSchema.bcpnpAssignment.expiresAt,
            revokedAt: bcpnpSchema.bcpnpAssignment.revokedAt,
        })
        .from(bcpnpSchema.bcpnpAssignment)
        .where(
            and(
                eq(bcpnpSchema.bcpnpAssignment.fileId, fileId),
                eq(bcpnpSchema.bcpnpAssignment.memberId, member.id),
                isNull(bcpnpSchema.bcpnpAssignment.revokedAt)
            )
        )
        .limit(1);

    // 3. Check applicant consent for this org
    const [consent] = await db()
        .select({ id: bcpnpSchema.bcpnpConsent.id })
        .from(bcpnpSchema.bcpnpConsent)
        .where(
            and(
                eq(bcpnpSchema.bcpnpConsent.fileId, fileId),
                eq(bcpnpSchema.bcpnpConsent.orgId, member.orgId),
                isNull(bcpnpSchema.bcpnpConsent.withdrawnAt)
            )
        )
        .limit(1);

    return buildPartnerActor({
        userId,
        role: "partner",
        partnerTier: member.tier,
        partnerOrgId: member.orgId,
        sectionGrants: assignment?.sectionGrants ?? null,
        assignmentExpiresAt: assignment?.expiresAt ?? null,
        revokedAt: assignment?.revokedAt ?? null,
        hasConsent: !!consent,
    });
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
            workbookStatus: bcpnpSchema.bcpnpCase.workbookStatus,
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
            workbookStatus: bcpnpSchema.bcpnpCase.workbookStatus,
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

/**
 * Returns BC PNP cases for a partner org admin — all files assigned to their firm.
 */
export async function listPartnerOrgCases(user: CurrentUser, orgId: string) {
    if (user.role !== "partner") return [];

    return db()
        .select({
            id: bcpnpSchema.bcpnpCase.id,
            stream: bcpnpSchema.bcpnpCase.stream,
            stage: bcpnpSchema.bcpnpCase.stage,
            status: bcpnpSchema.bcpnpCase.status,
            workbookStatus: bcpnpSchema.bcpnpCase.workbookStatus,
            openedAt: bcpnpSchema.bcpnpCase.openedAt,
            applicantName: schema.user.name,
        })
        .from(bcpnpSchema.bcpnpCase)
        .innerJoin(bcpnpSchema.bcpnpAssignment, eq(bcpnpSchema.bcpnpAssignment.fileId, bcpnpSchema.bcpnpCase.id))
        .innerJoin(bcpnpSchema.bcpnpPartnerMember, eq(bcpnpSchema.bcpnpPartnerMember.id, bcpnpSchema.bcpnpAssignment.memberId))
        .leftJoin(schema.user, eq(bcpnpSchema.bcpnpCase.applicantId, schema.user.id))
        .where(
            and(
                eq(bcpnpSchema.bcpnpPartnerMember.orgId, orgId),
                isNull(bcpnpSchema.bcpnpAssignment.revokedAt)
            )
        )
        .orderBy(bcpnpSchema.bcpnpCase.openedAt);
}
