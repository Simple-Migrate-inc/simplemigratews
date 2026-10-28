import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { audit } from "../audit";
import {
    type Actor,
    type CaseAccess,
    type GrantForAccess,
    type GrantScope,
    decideCaseAccess,
} from "./access";
import type { CurrentUser } from "./session";

export async function actorFor(user: CurrentUser): Promise<Actor> {
    if (user.role === "partner") {
        const rows = await db()
            .select({ partnerId: schema.partnerMember.partnerId })
            .from(schema.partnerMember)
            .where(eq(schema.partnerMember.userId, user.id));
        return { id: user.id, role: user.role, partnerIds: rows.map((r) => r.partnerId) };
    }
    if (user.role === "agent") {
        const [a] = await db()
            .select({ id: schema.agent.id, status: schema.agent.status })
            .from(schema.agent)
            .where(eq(schema.agent.userId, user.id))
            .limit(1);
        // Unverified, suspended or lapsed agents get no case access at all.
        return { id: user.id, role: user.role, agentId: a?.status === "verified" ? a.id : null };
    }
    return { id: user.id, role: user.role };
}

export type OpenedCase = {
    case: typeof schema.dashCase.$inferSelect;
    access: CaseAccess;
    actor: Actor;
};

/**
 * Load a case for the current user, enforcing access, and write an audit
 * event for the read. Returns null when the user has no access.
 */
export async function openCase(
    user: CurrentUser,
    caseId: string,
    action = "case.view"
): Promise<OpenedCase | null> {
    const [c] = await db()
        .select()
        .from(schema.dashCase)
        .where(eq(schema.dashCase.id, caseId))
        .limit(1);
    if (!c) return null;

    const actor = await actorFor(user);
    let grants: GrantForAccess[] = [];
    if (actor.role === "partner" || actor.role === "agent") {
        const rows = await db()
            .select()
            .from(schema.consentGrant)
            .where(eq(schema.consentGrant.caseId, caseId));
        grants = rows.map((g) => ({
            id: g.id,
            granteeType: g.granteeType,
            partnerId: g.partnerId,
            agentId: g.agentId,
            status: g.status,
            approvedAt: g.approvedAt,
            revokedAt: g.revokedAt,
            expiresAt: g.expiresAt,
            scope: g.scope as GrantScope,
        }));
    }

    const access = decideCaseAccess(actor, c, grants);
    await audit({
        actorId: user.id,
        action: access ? action : `${action}.denied`,
        objectType: "case",
        objectId: caseId,
        caseId,
    });
    return access ? { case: c, access, actor } : null;
}
