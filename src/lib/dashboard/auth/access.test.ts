import { describe, expect, it } from "vitest";
import {
    type Actor,
    type GrantForAccess,
    canEditCase,
    canReadDocument,
    canReadSummary,
    canReleaseSummary,
    decideCaseAccess,
    isGrantActive,
} from "./access";
import { canEnterArea, requiresMfa } from "./roles";

const NOW = new Date("2026-10-14T12:00:00Z");
const later = new Date("2026-11-13T12:00:00Z");
const earlier = new Date("2026-10-01T12:00:00Z");

const theCase = { id: "case-1", candidateId: "cand-1", consultantId: "cons-1" };

const grant = (over: Partial<GrantForAccess> = {}): GrantForAccess => ({
    id: "g1",
    granteeType: "partner",
    partnerId: "p1",
    agentId: null,
    status: "approved",
    approvedAt: earlier,
    revokedAt: null,
    expiresAt: later,
    scope: { documentIds: ["doc-a"], summaryVersion: 2 },
    ...over,
});

const partner: Actor = { id: "puser", role: "partner", partnerIds: ["p1"] };
const agent: Actor = { id: "auser", role: "agent", agentId: "agent-1" };

describe("decideCaseAccess", () => {
    it("lets a candidate open only their own case", () => {
        expect(decideCaseAccess({ id: "cand-1", role: "candidate" }, theCase, [], NOW)).toEqual({
            kind: "owner",
        });
        expect(decideCaseAccess({ id: "cand-2", role: "candidate" }, theCase, [], NOW)).toBeNull();
    });

    it("lets only the assigned consultant open the case", () => {
        expect(decideCaseAccess({ id: "cons-1", role: "consultant" }, theCase, [], NOW)?.kind).toBe(
            "assigned_consultant"
        );
        expect(decideCaseAccess({ id: "cons-2", role: "consultant" }, theCase, [], NOW)).toBeNull();
    });

    it("gives a partner no access without an approved grant", () => {
        expect(decideCaseAccess(partner, theCase, [], NOW)).toBeNull();
        expect(
            decideCaseAccess(partner, theCase, [grant({ status: "proposed", approvedAt: null })], NOW)
        ).toBeNull();
    });

    it("gives a partner access through an approved, unexpired grant to their firm", () => {
        expect(decideCaseAccess(partner, theCase, [grant()], NOW)?.kind).toBe("grant");
        expect(decideCaseAccess(partner, theCase, [grant({ partnerId: "other" })], NOW)).toBeNull();
    });

    it("blocks access immediately once a grant is revoked", () => {
        const revoked = grant({ status: "revoked", revokedAt: NOW });
        expect(isGrantActive(revoked, NOW)).toBe(false);
        expect(decideCaseAccess(partner, theCase, [revoked], NOW)).toBeNull();
        // Even if status was not updated, a revokedAt timestamp is enough.
        expect(decideCaseAccess(partner, theCase, [grant({ revokedAt: NOW })], NOW)).toBeNull();
    });

    it("blocks access after a grant expires", () => {
        expect(decideCaseAccess(partner, theCase, [grant({ expiresAt: earlier })], NOW)).toBeNull();
    });

    it("never lets a partner grant be used by an agent, or vice versa", () => {
        expect(decideCaseAccess(agent, theCase, [grant()], NOW)).toBeNull();
        const agentGrant = grant({ granteeType: "agent", partnerId: null, agentId: "agent-1" });
        expect(decideCaseAccess(partner, theCase, [agentGrant], NOW)).toBeNull();
        expect(decideCaseAccess(agent, theCase, [agentGrant], NOW)?.kind).toBe("grant");
        expect(decideCaseAccess({ ...agent, agentId: "agent-2" }, theCase, [agentGrant], NOW)).toBeNull();
    });
});

describe("document and summary scope", () => {
    it("lets a partner read only documents in scope", () => {
        const access = decideCaseAccess(partner, theCase, [grant()], NOW)!;
        expect(canReadDocument(access, partner, "doc-a", { isImmigrationDocument: true })).toBe(true);
        expect(canReadDocument(access, partner, "doc-b", { isImmigrationDocument: false })).toBe(false);
    });

    it("never shows an agent immigration documents unless explicitly in scope", () => {
        const g = grant({ granteeType: "agent", partnerId: null, agentId: "agent-1" });
        const access = decideCaseAccess(agent, theCase, [g], NOW)!;
        expect(canReadDocument(access, agent, "doc-a", { isImmigrationDocument: true })).toBe(false);
        expect(canReadDocument(access, agent, "doc-a", { isImmigrationDocument: false })).toBe(true);

        const g2 = grant({
            granteeType: "agent",
            partnerId: null,
            agentId: "agent-1",
            scope: { documentIds: ["doc-a"], includeImmigrationDocuments: true },
        });
        const access2 = decideCaseAccess(agent, theCase, [g2], NOW)!;
        expect(canReadDocument(access2, agent, "doc-a", { isImmigrationDocument: true })).toBe(true);
    });

    it("limits summaries to the granted version", () => {
        const access = decideCaseAccess(partner, theCase, [grant()], NOW)!;
        expect(canReadSummary(access, 2)).toBe(true);
        expect(canReadSummary(access, 3)).toBe(false);
    });
});

describe("editing and release", () => {
    it("allows edits only by the assigned consultant or admin", () => {
        expect(canEditCase({ kind: "assigned_consultant" })).toBe(true);
        expect(canEditCase({ kind: "admin" })).toBe(true);
        expect(canEditCase({ kind: "owner" })).toBe(false);
        expect(canEditCase({ kind: "grant", grants: [] })).toBe(false);
    });

    it("refuses summary release by an unlicensed consultant", () => {
        const assigned = { kind: "assigned_consultant" } as const;
        expect(canReleaseSummary({ role: "consultant", licenceVerifiedAt: null }, assigned)).toBe(false);
        expect(canReleaseSummary({ role: "consultant", licenceVerifiedAt: NOW }, assigned)).toBe(true);
        expect(canReleaseSummary({ role: "admin", licenceVerifiedAt: NOW }, { kind: "admin" })).toBe(false);
    });
});

describe("roles", () => {
    it("requires MFA for every role except candidate", () => {
        expect(requiresMfa("candidate")).toBe(false);
        for (const r of ["consultant", "admin", "partner", "agent"] as const) {
            expect(requiresMfa(r)).toBe(true);
        }
    });

    it("keeps each role in its own area, except admin", () => {
        expect(canEnterArea("candidate", "consultant")).toBe(false);
        expect(canEnterArea("partner", "agent")).toBe(false);
        expect(canEnterArea("admin", "partner")).toBe(true);
    });
});
