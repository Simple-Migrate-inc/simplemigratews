import { describe, it, expect } from "vitest";
import { can, buildPartnerActor } from "./permissions";
import type { PnpActor } from "./permissions";

// ─── Shared actor fixtures ────────────────────────────────────────────────────

const superuser: PnpActor = { userId: "u1", role: "superuser" };
const admin: PnpActor = { userId: "u2", role: "admin" };
const consultant: PnpActor = { userId: "u3", role: "consultant" };
const candidate: PnpActor = { userId: "u4", role: "candidate", isFileOwner: true };
const candidateNotOwner: PnpActor = { userId: "u5", role: "candidate", isFileOwner: false };

// Partner actors — active assignment with consent
const orgAdmin: PnpActor = {
    userId: "p1", role: "partner", partnerTier: "org_admin",
    assignmentActive: true, hasConsent: true, partnerOrgId: "org1",
};
const l3: PnpActor = {
    userId: "p2", role: "partner", partnerTier: "l3",
    assignmentActive: true, hasConsent: true, partnerOrgId: "org1",
};
const l2NetWorth: PnpActor = {
    userId: "p3", role: "partner", partnerTier: "l2",
    assignmentActive: true, hasConsent: true, partnerOrgId: "org1",
    sectionGrants: ["net_worth"],
};
const l2Concept: PnpActor = {
    userId: "p4", role: "partner", partnerTier: "l2",
    assignmentActive: true, hasConsent: true, partnerOrgId: "org1",
    sectionGrants: ["concept"],
};
const l2NoGrants: PnpActor = {
    userId: "p5", role: "partner", partnerTier: "l2",
    assignmentActive: true, hasConsent: true, partnerOrgId: "org1",
    sectionGrants: [],
};
const l1: PnpActor = {
    userId: "p6", role: "partner", partnerTier: "l1",
    assignmentActive: true, hasConsent: true, partnerOrgId: "org1",
};
const mk: PnpActor = {
    userId: "p7", role: "partner", partnerTier: "mk",
    partnerOrgId: "org1",
};
// Revoked / expired partner
const l3Revoked: PnpActor = {
    userId: "p8", role: "partner", partnerTier: "l3",
    assignmentActive: false, hasConsent: true, partnerOrgId: "org1",
};
const l3NoConsent: PnpActor = {
    userId: "p9", role: "partner", partnerTier: "l3",
    assignmentActive: true, hasConsent: false, partnerOrgId: "org1",
};

// ─── Superuser / admin — omnipotent ──────────────────────────────────────────

describe("superuser and admin", () => {
    const all_actions = [
        "file.list_all", "file.list_firm", "file.list_assigned", "file.list_own",
        "file.list_sourced", "file.create", "file.refer",
        "section.view", "section.edit",
        "score.view_full", "score.view_band",
        "status.change",
        "ai.concept", "ai.advisor",
        "export.full", "export.summary",
        "assign.manage", "consent.manage",
        "org.manage", "rules.edit",
        "audit.view_all", "audit.view_firm", "audit.view_own",
        "marketing.dashboard",
    ] as const;

    for (const action of all_actions) {
        it(`superuser can ${action}`, () => {
            expect(can(superuser, action, "net_worth")).toBe(true);
        });
        it(`admin can ${action}`, () => {
            expect(can(admin, action, "net_worth")).toBe(true);
        });
    }
});

// ─── Sensitive sections — L1 and MK can never read them ──────────────────────

describe("sensitive section protection", () => {
    const sensitiveSections = ["registrant", "net_worth", "attachments"];
    const blockedActors = [l1, mk];

    for (const section of sensitiveSections) {
        for (const actor of blockedActors) {
            it(`${actor.partnerTier} cannot view ${section}`, () => {
                expect(can(actor, "section.view", section)).toBe(false);
            });
        }
    }

    // L2 without net_worth grant cannot view it
    it("l2 without net_worth grant cannot view net_worth", () => {
        expect(can(l2Concept, "section.view", "net_worth")).toBe(false);
    });

    // L2 WITH net_worth grant can view it
    it("l2 with net_worth grant can view net_worth", () => {
        expect(can(l2NetWorth, "section.view", "net_worth")).toBe(true);
    });
});

// ─── L2 section grants ────────────────────────────────────────────────────────

describe("l2 section grants", () => {
    it("l2 with concept grant can view concept", () => {
        expect(can(l2Concept, "section.view", "concept")).toBe(true);
    });

    it("l2 with concept grant cannot view experience (not granted)", () => {
        expect(can(l2Concept, "section.view", "experience")).toBe(false);
    });

    it("l2 with no grants cannot view any section", () => {
        const sections = ["registrant", "experience", "net_worth", "concept", "investment"];
        for (const s of sections) {
            expect(can(l2NoGrants, "section.view", s)).toBe(false);
        }
    });

    it("l2 with concept grant can edit concept", () => {
        expect(can(l2Concept, "section.edit", "concept")).toBe(true);
    });

    it("l2 with concept grant cannot edit experience", () => {
        expect(can(l2Concept, "section.edit", "experience")).toBe(false);
    });

    it("l2 with concept grant can use ai.concept", () => {
        expect(can(l2Concept, "ai.concept")).toBe(true);
    });

    it("l2 without concept grant cannot use ai.concept", () => {
        expect(can(l2NetWorth, "ai.concept")).toBe(false);
    });

    it("l2 cannot use ai.advisor regardless of grants", () => {
        expect(can(l2Concept, "ai.advisor")).toBe(false);
    });
});

// ─── Revoked / expired assignments fail immediately ───────────────────────────

describe("revoked assignments", () => {
    it("revoked l3 cannot view any section", () => {
        expect(can(l3Revoked, "section.view", "experience")).toBe(false);
    });

    it("revoked l3 cannot edit sections", () => {
        expect(can(l3Revoked, "section.edit", "concept")).toBe(false);
    });

    it("revoked l3 cannot change status", () => {
        expect(can(l3Revoked, "status.change")).toBe(false);
    });

    it("revoked l3 cannot use ai.concept", () => {
        expect(can(l3Revoked, "ai.concept")).toBe(false);
    });

    it("l3 without consent cannot view sections", () => {
        expect(can(l3NoConsent, "section.view", "experience")).toBe(false);
    });
});

// ─── Cross-role section access ────────────────────────────────────────────────

describe("section.view by role", () => {
    const sections = ["registrant", "experience", "net_worth", "adaptability", "language",
        "community", "concept", "investment", "jobs", "attachments"];

    it("consultant can view all sections", () => {
        for (const s of sections) {
            expect(can(consultant, "section.view", s)).toBe(true);
        }
    });

    it("l3 can view all sections", () => {
        for (const s of sections) {
            expect(can(l3, "section.view", s)).toBe(true);
        }
    });

    it("org_admin can view all sections", () => {
        for (const s of sections) {
            expect(can(orgAdmin, "section.view", s)).toBe(true);
        }
    });

    it("candidate (owner) can view all sections on own file", () => {
        for (const s of sections) {
            expect(can(candidate, "section.view", s)).toBe(true);
        }
    });

    it("candidate (not owner) cannot view sections", () => {
        for (const s of sections) {
            expect(can(candidateNotOwner, "section.view", s)).toBe(false);
        }
    });

    it("l1 can view community (summary) but not sensitive sections", () => {
        expect(can(l1, "section.view", "community")).toBe(true);
        expect(can(l1, "section.view", "registrant")).toBe(false);
        expect(can(l1, "section.view", "net_worth")).toBe(false);
        expect(can(l1, "section.view", "experience")).toBe(false);
        expect(can(l1, "section.view", "attachments")).toBe(false);
    });

    it("mk cannot view any file content sections", () => {
        for (const s of sections) {
            expect(can(mk, "section.view", s)).toBe(false);
        }
    });
});

// ─── section.edit restrictions ────────────────────────────────────────────────

describe("section.edit by role", () => {
    it("org_admin cannot edit sections", () => {
        expect(can(orgAdmin, "section.edit", "experience")).toBe(false);
    });

    it("l1 cannot edit sections", () => {
        expect(can(l1, "section.edit", "experience")).toBe(false);
    });

    it("mk cannot edit sections", () => {
        expect(can(mk, "section.edit", "experience")).toBe(false);
    });

    it("candidate can edit own editable sections", () => {
        expect(can(candidate, "section.edit", "experience")).toBe(true);
        expect(can(candidate, "section.edit", "net_worth")).toBe(true);
        expect(can(candidate, "section.edit", "attachments")).toBe(true);
    });

    it("candidate cannot edit concept (not applicant-editable)", () => {
        // concept is not in APPLICANT_EDITABLE_SECTIONS
        expect(can(candidate, "section.edit", "concept")).toBe(false);
    });
});

// ─── Score visibility ─────────────────────────────────────────────────────────

describe("score visibility", () => {
    it("consultant sees full score", () => {
        expect(can(consultant, "score.view_full")).toBe(true);
    });

    it("candidate sees full score (estimate label enforced in UI)", () => {
        expect(can(candidate, "score.view_full")).toBe(true);
    });

    it("l3 sees full score", () => {
        expect(can(l3, "score.view_full")).toBe(true);
    });

    it("org_admin sees full score", () => {
        expect(can(orgAdmin, "score.view_full")).toBe(true);
    });

    it("l1 sees band only, not full", () => {
        expect(can(l1, "score.view_full")).toBe(false);
        expect(can(l1, "score.view_band")).toBe(true);
    });

    it("mk sees band only, not full", () => {
        expect(can(mk, "score.view_full")).toBe(false);
        expect(can(mk, "score.view_band")).toBe(true);
    });

    it("l2 sees full score only if score section is granted", () => {
        const l2WithScore: PnpActor = {
            ...l2NoGrants, sectionGrants: ["score"],
        };
        expect(can(l2WithScore, "score.view_full")).toBe(true);
        expect(can(l2NoGrants, "score.view_full")).toBe(false);
    });
});

// ─── Status change ────────────────────────────────────────────────────────────

describe("status.change", () => {
    it("consultant can change status", () => {
        expect(can(consultant, "status.change")).toBe(true);
    });

    it("l3 (active) can change status", () => {
        expect(can(l3, "status.change")).toBe(true);
    });

    it("l3 (revoked) cannot change status", () => {
        expect(can(l3Revoked, "status.change")).toBe(false);
    });

    it("org_admin cannot change status", () => {
        expect(can(orgAdmin, "status.change")).toBe(false);
    });

    it("l2 cannot change status", () => {
        expect(can(l2Concept, "status.change")).toBe(false);
    });

    it("l1 cannot change status", () => {
        expect(can(l1, "status.change")).toBe(false);
    });

    it("candidate cannot change status", () => {
        expect(can(candidate, "status.change")).toBe(false);
    });
});

// ─── Cross-firm access returns false (enforced at DB layer, proven here) ──────

describe("cross-firm access", () => {
    // A partner from a different org should have no assignment for this file.
    // Simulate: assignmentActive = false (no assignment found).
    const differentOrgL3: PnpActor = {
        userId: "other1", role: "partner", partnerTier: "l3",
        partnerOrgId: "org2",
        assignmentActive: false, // no assignment for this file
        hasConsent: false,
    };

    it("l3 from different org with no assignment cannot view sections", () => {
        expect(can(differentOrgL3, "section.view", "experience")).toBe(false);
    });

    it("l3 from different org cannot change status", () => {
        expect(can(differentOrgL3, "status.change")).toBe(false);
    });
});

// ─── Marketing partner ────────────────────────────────────────────────────────

describe("marketing partner (mk)", () => {
    it("mk can access marketing dashboard", () => {
        expect(can(mk, "marketing.dashboard")).toBe(true);
    });

    it("mk can list sourced leads", () => {
        expect(can(mk, "file.list_sourced")).toBe(true);
    });

    it("mk can submit refer form", () => {
        expect(can(mk, "file.refer")).toBe(true);
    });

    it("mk cannot view any file section", () => {
        const sections = ["registrant", "experience", "concept", "score"];
        for (const s of sections) {
            expect(can(mk, "section.view", s)).toBe(false);
        }
    });

    it("mk cannot use AI features", () => {
        expect(can(mk, "ai.concept")).toBe(false);
        expect(can(mk, "ai.advisor")).toBe(false);
    });

    it("mk cannot change status", () => {
        expect(can(mk, "status.change")).toBe(false);
    });

    it("non-mk cannot access marketing dashboard", () => {
        expect(can(l1, "marketing.dashboard")).toBe(false);
        expect(can(l3, "marketing.dashboard")).toBe(false);
        expect(can(candidate, "marketing.dashboard")).toBe(false);
        expect(can(consultant, "marketing.dashboard")).toBe(false);
    });
});

// ─── buildPartnerActor helper ─────────────────────────────────────────────────

describe("buildPartnerActor", () => {
    it("marks assignmentActive=true when not revoked and not expired", () => {
        const actor = buildPartnerActor({
            userId: "u", role: "partner", partnerTier: "l3",
            partnerOrgId: "org1",
            sectionGrants: null,
            assignmentExpiresAt: new Date(Date.now() + 86400_000), // tomorrow
            revokedAt: null,
            hasConsent: true,
        });
        expect(actor.assignmentActive).toBe(true);
    });

    it("marks assignmentActive=false when revokedAt is set", () => {
        const actor = buildPartnerActor({
            userId: "u", role: "partner", partnerTier: "l3",
            partnerOrgId: "org1",
            sectionGrants: null,
            assignmentExpiresAt: null,
            revokedAt: new Date(Date.now() - 3600_000),
            hasConsent: true,
        });
        expect(actor.assignmentActive).toBe(false);
    });

    it("marks assignmentActive=false when expiresAt is in the past", () => {
        const actor = buildPartnerActor({
            userId: "u", role: "partner", partnerTier: "l3",
            partnerOrgId: "org1",
            sectionGrants: null,
            assignmentExpiresAt: new Date(Date.now() - 3600_000),
            revokedAt: null,
            hasConsent: true,
        });
        expect(actor.assignmentActive).toBe(false);
    });
});

// ─── Org / rules / audit gating ──────────────────────────────────────────────

describe("admin-only actions", () => {
    const restricted = ["org.manage", "rules.edit", "audit.view_all"] as const;

    for (const action of restricted) {
        it(`${action} is superuser/admin only`, () => {
            expect(can(consultant, action)).toBe(false);
            expect(can(l3, action)).toBe(false);
            expect(can(candidate, action)).toBe(false);
            expect(can(mk, action)).toBe(false);
        });
    }

    it("org_admin can view firm audit", () => {
        expect(can(orgAdmin, "audit.view_firm")).toBe(true);
    });

    it("candidate can view own file audit", () => {
        expect(can(candidate, "audit.view_own")).toBe(true);
    });
});
