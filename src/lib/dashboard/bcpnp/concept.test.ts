import { describe, expect, it } from "vitest";
import {
    checkBusinessConcept,
    checkJobQualification,
    computeInvestmentEligibility,
} from "./concept";
import type { InvestmentLineInput, JobPlanInput } from "./concept";

const RULES = {
    "base.investment_min_cad": 200000,
    "regional.investment_min_cad": 100000,
    "inv_cap.operating_months_new": 6,
    "inv_cap.operating_months_purchased": 3,
    "inv_cap.inventory_months": 3,
    "inv_cap.vehicle_max_cad": 15000,
    "base.purchase_price_max_cad": 150000,
    "fte.min_hours_per_week": 30,
    "fte.min_hours_per_year": 1560,
};

// ─── Investment cap tests ─────────────────────────────────────────────────────

describe("computeInvestmentEligibility — vehicle cap", () => {
    it("$20,000 vehicle counts as $15,000", () => {
        const lines: InvestmentLineInput[] = [
            {
                id: "1",
                description: "Business vehicle",
                category: "vehicle",
                amountCadCents: 2_000_000,
                preIta: false,
                externalFinancing: false,
            },
        ];
        const result = computeInvestmentEligibility(lines, "base", "new", RULES);
        expect(result[0].eligibleCadCents).toBe(1_500_000);
        expect(result[0].capAppliedCadCents).toBe(1_500_000);
    });
});

describe("computeInvestmentEligibility — purchase price cap", () => {
    it("$250,000 purchase price counts as $150,000 under Base", () => {
        const lines: InvestmentLineInput[] = [
            {
                id: "1",
                description: "Business purchase price",
                category: "purchase_price",
                amountCadCents: 25_000_000,
                preIta: false,
                externalFinancing: false,
            },
        ];
        const result = computeInvestmentEligibility(lines, "base", "purchase", RULES);
        expect(result[0].eligibleCadCents).toBe(15_000_000);
    });

    it("purchase price is $0 eligible under Regional", () => {
        const lines: InvestmentLineInput[] = [
            {
                id: "1",
                description: "Business purchase price",
                category: "purchase_price",
                amountCadCents: 10_000_000,
                preIta: false,
                externalFinancing: false,
            },
        ];
        const result = computeInvestmentEligibility(lines, "regional", "purchase", RULES);
        expect(result[0].eligibleCadCents).toBe(0);
    });
});

describe("computeInvestmentEligibility — operating expense cap noted", () => {
    it("eight months of rent on a new business flags the cap (six months)", () => {
        const lines: InvestmentLineInput[] = [
            {
                id: "1",
                description: "Rent — 8 months",
                category: "operating",
                amountCadCents: 8 * 500_000,
                preIta: false,
                externalFinancing: false,
            },
        ];
        const result = computeInvestmentEligibility(lines, "base", "new", RULES);
        // Amount is not auto-reduced (we don't have monthly breakdowns); cap is flagged
        expect(result[0].capReason).toMatch(/6 months/);
    });
});

describe("computeInvestmentEligibility — pre-ITA spending", () => {
    it("spending dated before the invitation counts zero", () => {
        const lines: InvestmentLineInput[] = [
            {
                id: "1",
                description: "Equipment purchased before ITA",
                category: "equipment",
                amountCadCents: 5_000_000,
                preIta: true,
                externalFinancing: false,
            },
        ];
        const result = computeInvestmentEligibility(lines, "base", "new", RULES);
        expect(result[0].eligibleCadCents).toBe(0);
    });
});

// ─── Ineligible business checks ───────────────────────────────────────────────

describe("checkBusinessConcept", () => {
    it("flags tanning salon as ineligible", () => {
        const { ineligibleFlag } = checkBusinessConcept("Full-service tanning salon");
        expect(ineligibleFlag).toBeTruthy();
    });

    it("flags cannabis as a regulated sector (not a hard block)", () => {
        const { ineligibleFlag, regulatedSectorFlag } =
            checkBusinessConcept("Cannabis retail dispensary");
        expect(ineligibleFlag).toBeNull();
        expect(regulatedSectorFlag).toBeTruthy();
    });

    it("returns no flags for a standard café", () => {
        const { ineligibleFlag, regulatedSectorFlag } =
            checkBusinessConcept("Quick-service restaurant / café");
        expect(ineligibleFlag).toBeNull();
        expect(regulatedSectorFlag).toBeNull();
    });
});

// ─── FTE job qualification ────────────────────────────────────────────────────

describe("checkJobQualification", () => {
    it("disqualifies a job under 30 hours/week", () => {
        const jobs: JobPlanInput[] = [
            {
                id: "1",
                hoursPerWeek: 25,
                annualHours: 1300,
                isOnSite: true,
                isDirectEmployee: true,
                shareholderPct: null,
            },
        ];
        const result = checkJobQualification(jobs, RULES);
        expect(result[0].qualifiesAsFte).toBe(false);
        expect(result[0].disqualifyingReasons.length).toBeGreaterThan(0);
    });

    it("disqualifies a shareholder with ≥ 10% ownership", () => {
        const jobs: JobPlanInput[] = [
            {
                id: "1",
                hoursPerWeek: 40,
                annualHours: 2080,
                isOnSite: true,
                isDirectEmployee: true,
                shareholderPct: 10,
            },
        ];
        const result = checkJobQualification(jobs, RULES);
        expect(result[0].qualifiesAsFte).toBe(false);
    });

    it("qualifies a standard on-site full-time employee with no stake", () => {
        const jobs: JobPlanInput[] = [
            {
                id: "1",
                hoursPerWeek: 40,
                annualHours: 2080,
                isOnSite: true,
                isDirectEmployee: true,
                shareholderPct: null,
            },
        ];
        const result = checkJobQualification(jobs, RULES);
        expect(result[0].qualifiesAsFte).toBe(true);
    });
});
