/**
 * Global Partner Program permission system.
 *
 * canPartner(actor, action) is a pure function: no DB calls, no I/O.
 * Callers fetch the actor context from the DB and pass it in.
 */

import type { UserRole } from "@dashboard/db/schema";
import type { GpOrgType, GpMemberRole } from "@dashboard/db/gp-schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GpActor = {
    userId: string;
    role: UserRole;
    // Partner-only fields (populated after looking up gp_member)
    gpMemberRole?: GpMemberRole;    // 'org_admin' | 'member'
    gpOrgId?: string;
    gpOrgType?: GpOrgType;
    // Portal gate flags (looked up from gp_agreement + gp_kyc)
    agreementSigned?: boolean;
    kycComplete?: boolean;
    academyLevel1Complete?: boolean;
};

export type GpAction =
    | "application.view_list"   // view all applications list
    | "application.view"        // view one application detail
    | "application.screen"      // move to screening
    | "application.schedule"    // set meeting_at
    | "application.kyc"         // move to due_diligence
    | "application.approve"     // superuser only
    | "application.decline"     // superuser only
    | "application.waitlist"    // superuser or partner_manager
    | "org.view"                // view partner org
    | "org.list"                // list partner orgs
    | "org.manage"              // create/edit orgs
    | "kyc.view"                // view KYC record
    | "kyc.edit"                // edit KYC record
    | "referral.create"         // create a referral
    | "stage.view"              // view client stage (partner label only)
    | "collab.create"           // create collab request
    | "collab.answer"           // answer a collab request
    | "commission.view"         // view commission ledger
    | "commission.edit_rules"   // edit commission rules — superuser only
    | "payout.run"              // run payouts — superuser only
    | "payout.view"             // view payout history
    | "consent.give"            // client gives/withdraws consent
    | "portal.access";          // enter the partner portal

export function canPartner(actor: GpActor, action: GpAction): boolean {
    const isSuperAdmin = actor.role === "superuser" || actor.role === "admin";
    const isStaff = isSuperAdmin || actor.role === "partner_manager";
    const isPartner = actor.role === "partner";
    const isOrgAdmin = isPartner && actor.gpMemberRole === "org_admin";
    const isMember = isPartner && actor.gpMemberRole === "member";

    switch (action) {
        case "application.view_list": return isStaff;
        case "application.view":      return isStaff;
        case "application.screen":    return isStaff;
        case "application.schedule":  return isStaff;
        case "application.kyc":       return isStaff;
        case "application.approve":   return actor.role === "superuser";
        case "application.decline":   return actor.role === "superuser";
        case "application.waitlist":  return isSuperAdmin || actor.role === "partner_manager";
        case "org.view":              return isStaff || isOrgAdmin || isMember;
        case "org.list":              return isStaff;
        case "org.manage":            return isSuperAdmin;
        case "kyc.view":              return isStaff || isOrgAdmin;
        case "kyc.edit":              return isStaff;
        case "referral.create":       return isOrgAdmin || isMember;
        case "stage.view":            return isStaff || isOrgAdmin || isMember;
        case "collab.create":         return isStaff || isOrgAdmin || isMember;
        case "collab.answer":         return isStaff || isOrgAdmin || isMember;
        case "commission.view":       return isStaff || isOrgAdmin || isMember;
        case "commission.edit_rules": return actor.role === "superuser";
        case "payout.run":            return actor.role === "superuser";
        case "payout.view":           return isStaff || isOrgAdmin;
        case "consent.give":          return actor.role === "candidate";
        case "portal.access":
            return (isOrgAdmin || isMember) && !!actor.agreementSigned && !!actor.kycComplete;
        default:
            return false;
    }
}

export function buildGpActor(opts: {
    userId: string;
    role: UserRole;
    gpMemberRole?: GpMemberRole;
    gpOrgId?: string;
    gpOrgType?: GpOrgType;
    agreementSigned?: boolean;
    kycComplete?: boolean;
    academyLevel1Complete?: boolean;
}): GpActor {
    return { ...opts };
}
