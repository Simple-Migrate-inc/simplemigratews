import { describe, it, expect } from "vitest";
import { canPartner, type GpActor, type GpAction } from "./permissions";

// ─── Helper factories ─────────────────────────────────────────────────────────

const superuser = (): GpActor => ({ userId: "u1", role: "superuser" });
const admin = (): GpActor => ({ userId: "u2", role: "admin" });
const partnerManager = (): GpActor => ({ userId: "u3", role: "partner_manager" });
const orgAdmin = (extra: Partial<GpActor> = {}): GpActor => ({
    userId: "u4", role: "partner", gpMemberRole: "org_admin", gpOrgId: "org1", gpOrgType: "marketing",
    agreementSigned: true, kycComplete: true, ...extra,
});
const member = (extra: Partial<GpActor> = {}): GpActor => ({
    userId: "u5", role: "partner", gpMemberRole: "member", gpOrgId: "org1", gpOrgType: "marketing",
    agreementSigned: true, kycComplete: true, ...extra,
});
const candidate = (): GpActor => ({ userId: "u6", role: "candidate" });
const consultant = (): GpActor => ({ userId: "u7", role: "consultant" });

const ALL_ACTIONS: GpAction[] = [
    "application.view_list", "application.view", "application.screen", "application.schedule",
    "application.kyc", "application.approve", "application.decline", "application.waitlist",
    "org.view", "org.list", "org.manage", "kyc.view", "kyc.edit",
    "referral.create", "stage.view", "collab.create", "collab.answer",
    "commission.view", "commission.edit_rules", "payout.run", "payout.view",
    "consent.give", "portal.access",
];

// ─── Superuser ────────────────────────────────────────────────────────────────

describe("superuser", () => {
    it("can do every staff action", () => {
        const actor = superuser();
        const staffActions: GpAction[] = [
            "application.view_list", "application.view", "application.screen",
            "application.schedule", "application.kyc", "application.approve",
            "application.decline", "application.waitlist", "org.view", "org.list",
            "org.manage", "kyc.view", "kyc.edit", "stage.view", "collab.create",
            "collab.answer", "commission.view", "commission.edit_rules", "payout.run", "payout.view",
        ];
        for (const a of staffActions) expect(canPartner(actor, a), a).toBe(true);
    });

    it("cannot give consent (that is for candidates)", () => {
        expect(canPartner(superuser(), "consent.give")).toBe(false);
    });

    it("cannot access portal (that is for partner members)", () => {
        expect(canPartner(superuser(), "portal.access")).toBe(false);
    });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

describe("admin", () => {
    it("can view and screen applications", () => {
        const actor = admin();
        expect(canPartner(actor, "application.view_list")).toBe(true);
        expect(canPartner(actor, "application.view")).toBe(true);
        expect(canPartner(actor, "application.screen")).toBe(true);
        expect(canPartner(actor, "application.schedule")).toBe(true);
        expect(canPartner(actor, "application.kyc")).toBe(true);
    });

    it("cannot approve or decline applications — superuser only", () => {
        expect(canPartner(admin(), "application.approve")).toBe(false);
        expect(canPartner(admin(), "application.decline")).toBe(false);
    });

    it("can waitlist", () => {
        expect(canPartner(admin(), "application.waitlist")).toBe(true);
    });

    it("cannot edit commission rules or run payouts", () => {
        expect(canPartner(admin(), "commission.edit_rules")).toBe(false);
        expect(canPartner(admin(), "payout.run")).toBe(false);
    });

    it("can manage orgs", () => {
        expect(canPartner(admin(), "org.manage")).toBe(true);
    });
});

// ─── Partner Manager ──────────────────────────────────────────────────────────

describe("partner_manager", () => {
    it("can view/screen/schedule/kyc applications", () => {
        const pm = partnerManager();
        expect(canPartner(pm, "application.view_list")).toBe(true);
        expect(canPartner(pm, "application.view")).toBe(true);
        expect(canPartner(pm, "application.screen")).toBe(true);
        expect(canPartner(pm, "application.schedule")).toBe(true);
        expect(canPartner(pm, "application.kyc")).toBe(true);
    });

    it("cannot approve or decline applications — superuser only", () => {
        expect(canPartner(partnerManager(), "application.approve")).toBe(false);
        expect(canPartner(partnerManager(), "application.decline")).toBe(false);
    });

    it("can waitlist", () => {
        expect(canPartner(partnerManager(), "application.waitlist")).toBe(true);
    });

    it("cannot edit commission rules", () => {
        expect(canPartner(partnerManager(), "commission.edit_rules")).toBe(false);
    });

    it("cannot run payouts", () => {
        expect(canPartner(partnerManager(), "payout.run")).toBe(false);
    });

    it("cannot manage orgs (superuser only)", () => {
        expect(canPartner(partnerManager(), "org.manage")).toBe(false);
    });

    it("can view KYC and commissions", () => {
        expect(canPartner(partnerManager(), "kyc.view")).toBe(true);
        expect(canPartner(partnerManager(), "commission.view")).toBe(true);
        expect(canPartner(partnerManager(), "payout.view")).toBe(true);
    });
});

// ─── Org Admin ────────────────────────────────────────────────────────────────

describe("org_admin partner", () => {
    it("can view own org", () => {
        expect(canPartner(orgAdmin(), "org.view")).toBe(true);
    });

    it("cannot list all orgs", () => {
        expect(canPartner(orgAdmin(), "org.list")).toBe(false);
    });

    it("cannot manage orgs", () => {
        expect(canPartner(orgAdmin(), "org.manage")).toBe(false);
    });

    it("can create referrals", () => {
        expect(canPartner(orgAdmin(), "referral.create")).toBe(true);
    });

    it("can view client stages", () => {
        expect(canPartner(orgAdmin(), "stage.view")).toBe(true);
    });

    it("can view commission ledger", () => {
        expect(canPartner(orgAdmin(), "commission.view")).toBe(true);
    });

    it("cannot edit commission rules", () => {
        expect(canPartner(orgAdmin(), "commission.edit_rules")).toBe(false);
    });

    it("cannot run payouts", () => {
        expect(canPartner(orgAdmin(), "payout.run")).toBe(false);
    });

    it("can view KYC", () => {
        expect(canPartner(orgAdmin(), "kyc.view")).toBe(true);
    });

    it("cannot edit KYC", () => {
        expect(canPartner(orgAdmin(), "kyc.edit")).toBe(false);
    });

    it("can view applications list — no", () => {
        expect(canPartner(orgAdmin(), "application.view_list")).toBe(false);
    });

    it("can access portal when agreement signed and KYC complete", () => {
        expect(canPartner(orgAdmin({ agreementSigned: true, kycComplete: true }), "portal.access")).toBe(true);
    });

    it("cannot access portal without agreement", () => {
        expect(canPartner(orgAdmin({ agreementSigned: false }), "portal.access")).toBe(false);
    });

    it("cannot access portal without KYC", () => {
        expect(canPartner(orgAdmin({ kycComplete: false }), "portal.access")).toBe(false);
    });

    it("cannot access portal without both flags", () => {
        expect(canPartner(orgAdmin({ agreementSigned: false, kycComplete: false }), "portal.access")).toBe(false);
    });
});

// ─── Member ───────────────────────────────────────────────────────────────────

describe("member partner", () => {
    it("can create referrals", () => {
        expect(canPartner(member(), "referral.create")).toBe(true);
    });

    it("can view own stage", () => {
        expect(canPartner(member(), "stage.view")).toBe(true);
    });

    it("can view commission ledger", () => {
        expect(canPartner(member(), "commission.view")).toBe(true);
    });

    it("cannot view payout history (org_admin only)", () => {
        expect(canPartner(member(), "payout.view")).toBe(false);
    });

    it("cannot view KYC", () => {
        expect(canPartner(member(), "kyc.view")).toBe(false);
    });

    it("cannot view application list", () => {
        expect(canPartner(member(), "application.view_list")).toBe(false);
    });

    it("cannot approve applications", () => {
        expect(canPartner(member(), "application.approve")).toBe(false);
    });

    it("can create collab requests", () => {
        expect(canPartner(member(), "collab.create")).toBe(true);
    });

    it("can access portal when gates are met", () => {
        expect(canPartner(member({ agreementSigned: true, kycComplete: true }), "portal.access")).toBe(true);
    });

    it("cannot access portal without agreement signed", () => {
        expect(canPartner(member({ agreementSigned: false }), "portal.access")).toBe(false);
    });

    it("cannot access portal without KYC complete", () => {
        expect(canPartner(member({ kycComplete: false }), "portal.access")).toBe(false);
    });
});

// ─── Candidate ────────────────────────────────────────────────────────────────

describe("candidate", () => {
    it("can give consent", () => {
        expect(canPartner(candidate(), "consent.give")).toBe(true);
    });

    it("cannot do any partner/staff actions", () => {
        const forbidden: GpAction[] = [
            "application.view_list", "application.view", "application.screen",
            "referral.create", "stage.view", "commission.view", "payout.run",
            "org.view", "portal.access",
        ];
        for (const a of forbidden) expect(canPartner(candidate(), a), a).toBe(false);
    });
});

// ─── Consultant (unlisted role) ───────────────────────────────────────────────

describe("consultant (not in partner program)", () => {
    it("cannot do any partner program actions", () => {
        const actor = consultant();
        for (const a of ALL_ACTIONS) {
            expect(canPartner(actor, a), a).toBe(false);
        }
    });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("edge cases", () => {
    it("partner without gpMemberRole cannot create referrals", () => {
        const actor: GpActor = { userId: "u8", role: "partner" };
        expect(canPartner(actor, "referral.create")).toBe(false);
    });

    it("partner without gpMemberRole cannot access portal", () => {
        const actor: GpActor = { userId: "u8", role: "partner", agreementSigned: true, kycComplete: true };
        expect(canPartner(actor, "portal.access")).toBe(false);
    });

    it("superuser cannot give consent", () => {
        expect(canPartner(superuser(), "consent.give")).toBe(false);
    });

    it("only superuser can run payouts", () => {
        expect(canPartner(admin(), "payout.run")).toBe(false);
        expect(canPartner(partnerManager(), "payout.run")).toBe(false);
        expect(canPartner(orgAdmin(), "payout.run")).toBe(false);
        expect(canPartner(superuser(), "payout.run")).toBe(true);
    });

    it("only superuser can edit commission rules", () => {
        expect(canPartner(admin(), "commission.edit_rules")).toBe(false);
        expect(canPartner(partnerManager(), "commission.edit_rules")).toBe(false);
        expect(canPartner(orgAdmin(), "commission.edit_rules")).toBe(false);
        expect(canPartner(superuser(), "commission.edit_rules")).toBe(true);
    });

    it("only superuser can approve applications", () => {
        expect(canPartner(admin(), "application.approve")).toBe(false);
        expect(canPartner(partnerManager(), "application.approve")).toBe(false);
        expect(canPartner(orgAdmin(), "application.approve")).toBe(false);
        expect(canPartner(superuser(), "application.approve")).toBe(true);
    });

    it("only superuser can decline applications", () => {
        expect(canPartner(admin(), "application.decline")).toBe(false);
        expect(canPartner(partnerManager(), "application.decline")).toBe(false);
        expect(canPartner(superuser(), "application.decline")).toBe(true);
    });

    it("superuser and admin and partner_manager can waitlist", () => {
        expect(canPartner(superuser(), "application.waitlist")).toBe(true);
        expect(canPartner(admin(), "application.waitlist")).toBe(true);
        expect(canPartner(partnerManager(), "application.waitlist")).toBe(true);
        expect(canPartner(orgAdmin(), "application.waitlist")).toBe(false);
        expect(canPartner(member(), "application.waitlist")).toBe(false);
    });
});
