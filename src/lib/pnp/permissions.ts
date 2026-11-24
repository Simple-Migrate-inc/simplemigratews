/**
 * PNP Workbook permission system — single source of truth.
 *
 * can(actor, action, sectionKey?) is a pure function: no DB calls, no I/O.
 * Callers fetch the actor context from the DB (role, tier, section grants for
 * the specific file) and pass it in. Every API route and server action uses this.
 *
 * Access model:
 *   superuser / admin → everything
 *   consultant → assigned files, full edit (maps to L3 in workbook context)
 *   partner (role) → sub-tier from bcpnp_partner_member:
 *     org_admin → all files in their firm, view-only
 *     l3        → assigned files, full edit, AI features, status changes
 *     l2        → assigned files, granted sections only
 *     l1        → assigned files, summary card only (no PII / net worth / docs)
 *     mk        → sourced leads list + marketing dashboard, never file content
 *   candidate → own file, self-declared sections, full score (estimate label)
 */

import type { UserRole } from "@dashboard/db/schema";
import type { BcpnpPartnerTier } from "@dashboard/db/bcpnp-schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PnpActor = {
    userId: string;
    role: UserRole;
    // Partner-only fields (populated after looking up bcpnp_partner_member)
    partnerTier?: BcpnpPartnerTier;
    partnerOrgId?: string;
    // Per-file context (populated after looking up bcpnp_assignment for this file)
    sectionGrants?: string[] | null; // null = use tier defaults
    assignmentActive?: boolean;      // false = revoked or expired
    hasConsent?: boolean;            // applicant consented for this org + file
    isFileOwner?: boolean;           // candidate who owns this specific file
};

export type PnpAction =
    // File list
    | "file.list_all"           // superuser/admin: every file
    | "file.list_firm"          // org_admin: files assigned to their firm
    | "file.list_assigned"      // l3/l2: files assigned to them
    | "file.list_own"           // candidate: own file
    | "file.list_sourced"       // mk: leads they sourced (summary only)
    // File creation
    | "file.create"             // superuser/admin/consultant/l3/org_admin
    | "file.refer"              // l1/mk: submit a referral form
    // Section access
    | "section.view"            // depends on role + sectionKey + grants
    | "section.edit"            // narrower than view
    // Score
    | "score.view_full"         // full breakdown with per-section detail
    | "score.view_band"         // score band only (l1, mk)
    // Status
    | "status.change"           // superuser, l3
    // AI features
    | "ai.concept"              // draft concept answers (superuser, l3, l2 if concept granted)
    | "ai.advisor"              // advisor chat / ways-to-raise (superuser, l3 only)
    // Export
    | "export.full"             // .md / PDF full (superuser, org_admin, l3)
    | "export.summary"          // summary PDF (candidate)
    // Assignment & consent management
    | "assign.manage"           // superuser, org_admin (own firm), l3 (request only)
    | "consent.manage"          // candidate: give / withdraw consent
    // Organisation management
    | "org.manage"              // superuser only: partner orgs, licence verification
    // Reference data
    | "rules.edit"              // superuser only
    // Audit
    | "audit.view_all"          // superuser: all audit events
    | "audit.view_firm"         // org_admin: firm's files
    | "audit.view_own"          // candidate: who viewed their file
    // Marketing
    | "marketing.dashboard";    // mk: campaigns + funnel stats

// Sections that contain PII or financial data (always audit-logged on read)
export const SENSITIVE_SECTIONS = new Set([
    "registrant",
    "net_worth",
    "attachments",
]);

// Sections L1 can never view (they may see community name but not full referral detail)
const L1_BLOCKED_SECTIONS = new Set([
    "registrant",
    "net_worth",
    "experience",
    "adaptability",
    "language",
    "concept",
    "investment",
    "jobs",
    "attachments",
    // "community" is NOT blocked — L1 sees community name; field-level trimming
    // is enforced in the serializer, not at the section-access level.
]);

// Sections the applicant may edit themselves
const APPLICANT_EDITABLE_SECTIONS = new Set([
    "registrant",
    "experience",
    "net_worth",
    "adaptability",
    "language",
    "investment",
    "jobs",
    "attachments",
]);

// ─── Core helper ─────────────────────────────────────────────────────────────

/**
 * Returns true when this actor may perform the action.
 *
 * For section.view and section.edit, pass the sectionKey.
 * For file-scoped actions (anything except list_all / org.manage / rules.edit /
 * marketing.dashboard / audit.view_all), populate actor.assignmentActive,
 * actor.hasConsent, actor.sectionGrants before calling.
 */
export function can(
    actor: PnpActor,
    action: PnpAction,
    sectionKey?: string
): boolean {
    const { role } = actor;

    // Superuser and admin can do everything
    if (role === "superuser" || role === "admin") return true;

    switch (action) {
        // ── File listing ──────────────────────────────────────────────────────
        case "file.list_all":
            return false; // superuser/admin only (handled above)

        case "file.list_firm":
            return role === "partner" && actor.partnerTier === "org_admin";

        case "file.list_assigned":
            return (
                role === "consultant" ||
                (role === "partner" &&
                    (actor.partnerTier === "l3" ||
                        actor.partnerTier === "l2" ||
                        actor.partnerTier === "l1"))
            );

        case "file.list_own":
            return role === "candidate";

        case "file.list_sourced":
            return role === "partner" && actor.partnerTier === "mk";

        // ── File creation ─────────────────────────────────────────────────────
        case "file.create":
            return (
                role === "consultant" ||
                (role === "partner" &&
                    (actor.partnerTier === "org_admin" || actor.partnerTier === "l3"))
            );

        case "file.refer":
            return (
                role === "partner" &&
                (actor.partnerTier === "l1" || actor.partnerTier === "mk")
            );

        // ── Section access ────────────────────────────────────────────────────
        case "section.view":
            return canViewSection(actor, sectionKey);

        case "section.edit":
            return canEditSection(actor, sectionKey);

        // ── Score ─────────────────────────────────────────────────────────────
        case "score.view_full":
            return (
                role === "consultant" ||
                role === "candidate" ||
                (role === "partner" &&
                    (actor.partnerTier === "org_admin" ||
                        actor.partnerTier === "l3" ||
                        (actor.partnerTier === "l2" &&
                            actor.assignmentActive === true &&
                            (actor.sectionGrants?.includes("score") ?? false))))
            );

        case "score.view_band":
            if (role !== "partner") return false;
            // L1 needs an active assignment to see score band
            if (actor.partnerTier === "l1") return actor.assignmentActive === true;
            // MK sees band for sourced leads (no formal assignment required — access
            // is through the campaign/source attribution, not bcpnp_assignment rows)
            if (actor.partnerTier === "mk") return true;
            return false;

        // ── Status ────────────────────────────────────────────────────────────
        case "status.change":
            return (
                role === "consultant" ||
                (role === "partner" && actor.partnerTier === "l3" && actor.assignmentActive === true)
            );

        // ── AI ────────────────────────────────────────────────────────────────
        case "ai.concept":
            if (role === "consultant") return true;
            if (role !== "partner") return false;
            if (actor.partnerTier === "l3" && actor.assignmentActive === true) return true;
            // L2 can use concept AI only when concept section is granted
            return (
                actor.partnerTier === "l2" &&
                actor.assignmentActive === true &&
                (actor.sectionGrants?.includes("concept") ?? false)
            );

        case "ai.advisor":
            return (
                role === "consultant" ||
                (role === "partner" && actor.partnerTier === "l3" && actor.assignmentActive === true)
            );

        // ── Export ────────────────────────────────────────────────────────────
        case "export.full":
            return (
                role === "consultant" ||
                (role === "partner" &&
                    (actor.partnerTier === "org_admin" || actor.partnerTier === "l3") &&
                    actor.assignmentActive === true)
            );

        case "export.summary":
            return role === "candidate" && actor.isFileOwner === true;

        // ── Assignments & consent ─────────────────────────────────────────────
        case "assign.manage":
            return (
                role === "consultant" ||
                (role === "partner" && actor.partnerTier === "org_admin")
            );

        case "consent.manage":
            return role === "candidate" && actor.isFileOwner === true;

        // ── Org management ────────────────────────────────────────────────────
        case "org.manage":
            return false; // superuser/admin only

        // ── Reference data ────────────────────────────────────────────────────
        case "rules.edit":
            return false; // superuser/admin only

        // ── Audit ─────────────────────────────────────────────────────────────
        case "audit.view_all":
            return false; // superuser/admin only

        case "audit.view_firm":
            return role === "partner" && actor.partnerTier === "org_admin";

        case "audit.view_own":
            return role === "candidate" && actor.isFileOwner === true;

        // ── Marketing ─────────────────────────────────────────────────────────
        case "marketing.dashboard":
            return role === "partner" && actor.partnerTier === "mk";

        default:
            return false;
    }
}

// ─── Section helpers ─────────────────────────────────────────────────────────

function canViewSection(actor: PnpActor, sectionKey?: string): boolean {
    if (!sectionKey) return false;
    const { role } = actor;

    // Candidate: own file only
    if (role === "candidate") {
        return actor.isFileOwner === true;
    }

    // Consultant (L3 equivalent in workbook context): full access to assigned files
    if (role === "consultant") return true;

    if (role !== "partner") return false;

    // MK and L1: blocked from all file content sections
    if (actor.partnerTier === "mk") return false;
    if (actor.partnerTier === "l1") return !L1_BLOCKED_SECTIONS.has(sectionKey);

    // All remaining partner tiers need an active assignment with consent
    if (!actor.assignmentActive || !actor.hasConsent) return false;

    // Org admin: view all sections on assigned files
    if (actor.partnerTier === "org_admin") return true;

    // L3: full access on assigned files
    if (actor.partnerTier === "l3") return true;

    // L2: only explicitly granted sections
    if (actor.partnerTier === "l2") {
        const grants = actor.sectionGrants;
        if (!grants) return false; // null sectionGrants = no access
        return grants.includes(sectionKey);
    }

    return false;
}

function canEditSection(actor: PnpActor, sectionKey?: string): boolean {
    if (!sectionKey) return false;
    const { role } = actor;

    // Candidate edits their own sections
    if (role === "candidate") {
        return actor.isFileOwner === true && APPLICANT_EDITABLE_SECTIONS.has(sectionKey);
    }

    // Consultant: full edit on assigned files
    if (role === "consultant") return true;

    if (role !== "partner") return false;

    // Org admin, L1, MK: no editing
    if (
        actor.partnerTier === "org_admin" ||
        actor.partnerTier === "l1" ||
        actor.partnerTier === "mk"
    ) {
        return false;
    }

    if (!actor.assignmentActive || !actor.hasConsent) return false;

    // L3: full edit on assigned files
    if (actor.partnerTier === "l3") return true;

    // L2: edit only granted sections
    if (actor.partnerTier === "l2") {
        const grants = actor.sectionGrants;
        if (!grants) return false;
        return grants.includes(sectionKey);
    }

    return false;
}

// ─── Context builder (DB layer) ───────────────────────────────────────────────

/**
 * Build a PnpActor for a partner user on a specific file.
 * Pass the results of your DB lookups; this stays pure for testability.
 */
export function buildPartnerActor(opts: {
    userId: string;
    role: UserRole;
    partnerTier: BcpnpPartnerTier;
    partnerOrgId: string;
    sectionGrants: string[] | null;
    assignmentExpiresAt: Date | null;
    revokedAt: Date | null;
    hasConsent: boolean;
}): PnpActor {
    const now = new Date();
    const assignmentActive =
        opts.revokedAt === null &&
        (opts.assignmentExpiresAt === null || opts.assignmentExpiresAt > now);

    return {
        userId: opts.userId,
        role: opts.role,
        partnerTier: opts.partnerTier,
        partnerOrgId: opts.partnerOrgId,
        sectionGrants: opts.sectionGrants,
        assignmentActive,
        hasConsent: opts.hasConsent,
    };
}
