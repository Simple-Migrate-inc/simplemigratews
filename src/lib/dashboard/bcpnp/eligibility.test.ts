import { describe, expect, it } from "vitest";
import { experiencePasses, runEligibilityScreener } from "./eligibility";
import type { EligibilityInputs } from "./eligibility";

const BASE_RULES = {
    "base.net_worth_min_cad": 600000,
    "base.investment_min_cad": 200000,
    "base.ownership_min_pct": 33.33,
    "base.large_equity_investment_min_cad": 1000000,
    "base.jobs_min": 1,
    "base.purchase_min_operating_months": 60,
    "regional.net_worth_min_cad": 300000,
    "regional.investment_min_cad": 100000,
    "regional.ownership_min_pct": 51,
    "regional.jobs_min": 1,
    "both.education_own_business_months": 36,
    "both.presence_ratio_min_pct": 75,
};

function fullBaseInputs(overrides: Partial<EligibilityInputs> = {}): EligibilityInputs {
    return {
        netWorthCadCents: 700_000_00, // $700,000
        proposedInvestmentCadCents: 250_000_00,
        proposedOwnershipPct: 51,
        equityInvestmentCadCents: null,
        ownerManagerMonths: 48,
        seniorManagerMonths: 0,
        ownerManagerPct: 51,
        seniorManagerDirectReports: 0,
        hasPostSecondary: true,
        selfEmployedMonthsLast60: null,
        languageTestType: "celpip",
        languageScores: { listening: 7, reading: 7, writing: 7, speaking: 7 },
        hasExploratoryVisit: null,
        hasCommunityReferral: null,
        residenceWithinKm: true,
        noLongFerry: true,
        residenceInsideCommunity: null,
        businessType: "new",
        currentOwnerOperatedMonths: null,
        numExistingJobs: null,
        numPlannedFteJobs: 1,
        ...overrides,
    };
}

// ─── Experience helper ────────────────────────────────────────────────────────

describe("experiencePasses", () => {
    it("passes with > 36 months owner-manager at ≥ 10%", () => {
        expect(experiencePasses(37, 0, 51, 0)).toBe(true);
    });

    it("fails with exactly 36 months owner-manager (must be > 36)", () => {
        expect(experiencePasses(36, 0, 51, 0)).toBe(false);
    });

    it("passes with > 48 months senior manager at ≥ 3 reports", () => {
        expect(experiencePasses(0, 49, 0, 3)).toBe(true);
    });

    it("passes with combined 12 owner + 24 senior", () => {
        expect(experiencePasses(12, 24, 10, 3)).toBe(true);
    });

    it("fails when ownership < 10% for owner-manager path", () => {
        expect(experiencePasses(48, 0, 9, 0)).toBe(false);
    });
});

// ─── Full screener ────────────────────────────────────────────────────────────

describe("runEligibilityScreener — Base", () => {
    it("all pass with valid inputs", () => {
        const report = runEligibilityScreener("base", fullBaseInputs(), BASE_RULES);
        expect(report.overall).toBe("pass");
    });

    it("fails when net worth is below threshold", () => {
        const report = runEligibilityScreener(
            "base",
            fullBaseInputs({ netWorthCadCents: 500_000_00 }),
            BASE_RULES
        );
        const nw = report.results.find((r) => r.key === "net_worth")!;
        expect(nw.status).toBe("fail");
        expect(report.overall).toBe("fail");
    });

    it("unknown when data is not provided", () => {
        const report = runEligibilityScreener(
            "base",
            fullBaseInputs({ netWorthCadCents: null }),
            BASE_RULES
        );
        const nw = report.results.find((r) => r.key === "net_worth")!;
        expect(nw.status).toBe("unknown");
    });
});

describe("runEligibilityScreener — Regional mandatory fields", () => {
    it("includes exploratory_visit and community_referral checks", () => {
        const inputs: EligibilityInputs = {
            ...fullBaseInputs(),
            netWorthCadCents: 350_000_00,
            proposedInvestmentCadCents: 110_000_00,
            proposedOwnershipPct: 51,
            residenceWithinKm: null,
            noLongFerry: null,
            residenceInsideCommunity: true,
            hasExploratoryVisit: false,
            hasCommunityReferral: false,
        };
        const report = runEligibilityScreener("regional", inputs, BASE_RULES);
        const ev = report.results.find((r) => r.key === "exploratory_visit")!;
        const cr = report.results.find((r) => r.key === "community_referral")!;
        expect(ev.status).toBe("fail");
        expect(cr.status).toBe("fail");
        expect(report.overall).toBe("fail");
    });
});
