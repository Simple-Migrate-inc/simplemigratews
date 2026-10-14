/**
 * Object-level authorization, evaluated server-side on every request:
 * role check + case assignment check + consent check.
 *
 * The decision functions here are pure so they can be unit tested; the
 * database loaders that feed them live in ./case-access.ts.
 */
import type { UserRole } from "../db/schema";

export type GrantScope = {
    documentIds: string[];
    summaryVersion?: number | null;
    /** Agents never see immigration documents unless this is explicitly true. */
    includeImmigrationDocuments?: boolean;
};

export type GrantForAccess = {
    id: string;
    granteeType: "partner" | "agent";
    partnerId: string | null;
    agentId: string | null;
    status: "proposed" | "approved" | "declined" | "revoked" | "expired";
    approvedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
    scope: GrantScope;
};

export type Actor = {
    id: string;
    role: UserRole;
    /** Partner firms the user belongs to (partner role). */
    partnerIds?: string[];
    /** Agent profile id (agent role). */
    agentId?: string | null;
};

export type CaseForAccess = {
    id: string;
    candidateId: string;
    consultantId: string | null;
};

export type CaseAccess =
    | { kind: "owner" }
    | { kind: "assigned_consultant" }
    | { kind: "admin" }
    | { kind: "grant"; grants: GrantForAccess[] };

export function isGrantActive(g: GrantForAccess, now: Date = new Date()): boolean {
    return (
        g.status === "approved" &&
        g.approvedAt !== null &&
        g.revokedAt === null &&
        g.expiresAt.getTime() > now.getTime()
    );
}

function grantMatchesActor(g: GrantForAccess, actor: Actor): boolean {
    if (actor.role === "partner") {
        return (
            g.granteeType === "partner" &&
            g.partnerId !== null &&
            (actor.partnerIds ?? []).includes(g.partnerId)
        );
    }
    if (actor.role === "agent") {
        return g.granteeType === "agent" && !!actor.agentId && g.agentId === actor.agentId;
    }
    return false;
}

/** Returns how the actor may access the case, or null for no access. */
export function decideCaseAccess(
    actor: Actor,
    c: CaseForAccess,
    grants: GrantForAccess[],
    now: Date = new Date()
): CaseAccess | null {
    switch (actor.role) {
        case "admin":
            return { kind: "admin" };
        case "candidate":
            return c.candidateId === actor.id ? { kind: "owner" } : null;
        case "consultant":
            return c.consultantId === actor.id ? { kind: "assigned_consultant" } : null;
        case "partner":
        case "agent": {
            const active = grants.filter(
                (g) => isGrantActive(g, now) && grantMatchesActor(g, actor)
            );
            return active.length > 0 ? { kind: "grant", grants: active } : null;
        }
        default:
            return null;
    }
}

/** Whether a given document in the case may be read under this access. */
export function canReadDocument(
    access: CaseAccess,
    actor: Actor,
    documentId: string,
    opts: { isImmigrationDocument: boolean }
): boolean {
    if (access.kind !== "grant") return true;
    return access.grants.some((g) => {
        if (!g.scope.documentIds.includes(documentId)) return false;
        if (actor.role === "agent" && opts.isImmigrationDocument) {
            return g.scope.includeImmigrationDocuments === true;
        }
        return true;
    });
}

/** Whether a released readiness summary version may be read. */
export function canReadSummary(access: CaseAccess, version: number): boolean {
    if (access.kind !== "grant") return true;
    return access.grants.some((g) => g.scope.summaryVersion === version);
}

/** Only the assigned consultant (or an admin) may change case content. */
export function canEditCase(access: CaseAccess): boolean {
    return access.kind === "assigned_consultant" || access.kind === "admin";
}

/**
 * Releasing a readiness summary requires a licensed consultant whose licence
 * has been verified.
 */
export function canReleaseSummary(
    actor: { role: UserRole; licenceVerifiedAt: Date | null },
    access: CaseAccess
): boolean {
    return (
        actor.role === "consultant" &&
        access.kind === "assigned_consultant" &&
        actor.licenceVerifiedAt !== null
    );
}
