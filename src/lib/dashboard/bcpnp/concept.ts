/**
 * Business concept checks — pure functions, no database calls.
 *
 * Covers: ineligible business hard-blocks, regulated-sector flags,
 * investment eligibility caps, and FTE job qualification.
 *
 * All values from the May 27, 2024 BC PNP guide (verified = false).
 */

import type { RuleMap } from "./rules-helpers";
import { ruleNumOr } from "./rules-helpers";
import type { BcpnpInvCategory, BcpnpStream } from "../db/bcpnp-schema";

// ─── Ineligible businesses (hard block) ───────────────────────────────────────

const INELIGIBLE_PATTERNS: { pattern: RegExp; reason: string }[] = [
    {
        pattern: /immigration.*(invest|scheme|fund)/i,
        reason: "Immigration-linked investment scheme",
    },
    { pattern: /redemption/i, reason: "Investment with a redemption option" },
    { pattern: /passive invest/i, reason: "Passive investment" },
    { pattern: /bed.and.breakfast|b&b/i, reason: "Bed and breakfast" },
    { pattern: /hobby farm/i, reason: "Hobby farm" },
    { pattern: /home.based business/i, reason: "Home-based business" },
    { pattern: /payday loan|cheque cash|money (chang|exchang)|cash machine/i, reason: "Payday loan / cheque cashing / money changing / cash machine" },
    { pattern: /pawnbroker/i, reason: "Pawnbroker" },
    { pattern: /tanning salon/i, reason: "Tanning salon" },
    { pattern: /dvd rental/i, reason: "DVD rental" },
    { pattern: /coin laund/i, reason: "Coin laundry" },
    { pattern: /automated car wash/i, reason: "Automated car wash" },
    { pattern: /scrap metal/i, reason: "Scrap metal recycling" },
    { pattern: /used goods/i, reason: "Used goods without value-added services" },
    { pattern: /real estate (broker|agent)/i, reason: "Real estate brokerage" },
    { pattern: /insurance broker/i, reason: "Insurance brokerage" },
    { pattern: /business broker/i, reason: "Business brokerage" },
    { pattern: /real estate develop/i, reason: "Real estate development" },
    { pattern: /goods trad/i, reason: "Goods trading without value-added service" },
    { pattern: /sexually explicit/i, reason: "Sexually explicit products or services" },
];

const REGULATED_PATTERNS: { pattern: RegExp; sector: string }[] = [
    { pattern: /agri(culture|food|cultur)/i, sector: "Agriculture and agri-food" },
    { pattern: /cannabis/i, sector: "Cannabis" },
    { pattern: /tobacco/i, sector: "Tobacco" },
    { pattern: /alcohol|brewery|winery|distillery/i, sector: "Alcohol" },
    { pattern: /child care|daycare|day care|school/i, sector: "Child care and schools" },
    { pattern: /financial service|bank|credit union|mortgage/i, sector: "Financial services" },
    { pattern: /forestry|mining/i, sector: "Forestry and mining" },
    { pattern: /health care|clinic|pharmacy|dental|medical/i, sector: "Health care and life sciences" },
    { pattern: /oil.and.gas|petroleum/i, sector: "Oil and gas" },
    { pattern: /passenger transport|taxi|ride.shar|charter bus/i, sector: "Passenger transport" },
    { pattern: /pharma(colog|ceutical)/i, sector: "Pharmacology" },
    { pattern: /residential care|long.term care|assisted living/i, sector: "Residential care" },
    { pattern: /telecom/i, sector: "Telecommunications" },
];

export type ConceptCheckResult = {
    ineligibleFlag: string | null;
    regulatedSectorFlag: string | null;
};

/**
 * Check whether a NAICS description triggers an ineligible-business block or
 * a regulated-sector flag. Returns flags only — rendering is the caller's job.
 */
export function checkBusinessConcept(naicsDescription: string): ConceptCheckResult {
    const text = naicsDescription.toLowerCase();

    for (const { pattern, reason } of INELIGIBLE_PATTERNS) {
        if (pattern.test(text)) {
            return { ineligibleFlag: reason, regulatedSectorFlag: null };
        }
    }

    for (const { pattern, sector } of REGULATED_PATTERNS) {
        if (pattern.test(text)) {
            return { ineligibleFlag: null, regulatedSectorFlag: sector };
        }
    }

    return { ineligibleFlag: null, regulatedSectorFlag: null };
}

// ─── Investment eligibility ────────────────────────────────────────────────────

export type InvestmentLineInput = {
    id: string;
    description: string;
    category: BcpnpInvCategory;
    amountCadCents: number;
    preIta: boolean;
    externalFinancing: boolean;
};

export type InvestmentLineResult = InvestmentLineInput & {
    eligibleCadCents: number;
    capAppliedCadCents: number | null;
    capReason: string | null;
};

export type InvestmentSummary = {
    lines: InvestmentLineResult[];
    totalAmountCadCents: number;
    totalEligibleCadCents: number;
    meetsMinimum: boolean | null;
    minimumCadCents: number;
};

/** Returns 0 for hard-ineligible categories; otherwise applies caps. */
export function computeInvestmentEligibility(
    lines: InvestmentLineInput[],
    stream: BcpnpStream,
    businessType: "new" | "purchase" | "franchise_new_location",
    rules: RuleMap
): InvestmentLineResult[] {
    const operatingMonths =
        businessType === "new" || businessType === "franchise_new_location"
            ? ruleNumOr(rules, "inv_cap.operating_months_new", 6)
            : ruleNumOr(rules, "inv_cap.operating_months_purchased", 3);

    const inventoryMonths = ruleNumOr(rules, "inv_cap.inventory_months", 3);
    const vehicleCap = ruleNumOr(rules, "inv_cap.vehicle_max_cad", 15000) * 100; // to cents
    const purchasePriceCap =
        stream === "base" ? ruleNumOr(rules, "base.purchase_price_max_cad", 150000) * 100 : 0;

    // We need average monthly amounts for operating/inventory caps.
    // The rule applies a months-cap to the total pool for that category.
    // A simple per-line approach: cap each line proportionally when totals exceed the limit.
    // For Phase 1, apply cap at the category aggregate level.

    const categoryTotals: Partial<Record<BcpnpInvCategory, number>> = {};
    for (const line of lines) {
        if (!line.preIta && !line.externalFinancing) {
            categoryTotals[line.category] =
                (categoryTotals[line.category] ?? 0) + line.amountCadCents;
        }
    }

    // Operating: cap = monthly * cap_months. We use the total and assume it's already
    // the capped amount (we don't have monthly breakdowns here). Caller should enforce.
    // For the cap check, we just document the rule.
    // Vehicle: aggregate cap
    const vehicleTotal = categoryTotals["vehicle"] ?? 0;
    const vehicleCapCents = vehicleCap;
    const vehicleRatio = vehicleTotal > vehicleCapCents ? vehicleCapCents / vehicleTotal : 1;

    // Purchase price: aggregate cap (Base only, purchase only)
    const purchaseTotal = categoryTotals["purchase_price"] ?? 0;
    const purchaseCapCents = purchasePriceCap;
    const purchaseRatio =
        stream === "base" && businessType === "purchase" && purchaseTotal > purchaseCapCents
            ? purchaseCapCents / purchaseTotal
            : 1;

    return lines.map((line): InvestmentLineResult => {
        // Pre-ITA or external financing = $0 eligible
        if (line.preIta) {
            return {
                ...line,
                eligibleCadCents: 0,
                capAppliedCadCents: 0,
                capReason: "Spending before the invitation-to-apply date is not eligible.",
            };
        }
        if (line.externalFinancing) {
            return {
                ...line,
                eligibleCadCents: 0,
                capAppliedCadCents: 0,
                capReason:
                    "External financing and grants do not count toward the minimum investment.",
            };
        }

        // Never-eligible categories (using descriptions as proxy)
        const neverEligible =
            line.category === "other" &&
            /real estate|working capital|refundable deposit|owner wage|family wage|research|r&d|immigration fee|professional fee|net worth report/i.test(
                line.description
            );

        if (neverEligible) {
            return {
                ...line,
                eligibleCadCents: 0,
                capAppliedCadCents: 0,
                capReason: "This item is never eligible under BC PNP investment rules.",
            };
        }

        let eligible = line.amountCadCents;
        let capApplied: number | null = null;
        let capReason: string | null = null;

        if (line.category === "vehicle") {
            if (vehicleRatio < 1) {
                eligible = Math.floor(line.amountCadCents * vehicleRatio);
                capApplied = vehicleCap;
                capReason = `Vehicle cap: up to CAD ${(vehicleCap / 100).toLocaleString("en-CA")} total across all vehicles.`;
            }
        } else if (line.category === "purchase_price") {
            if (stream !== "base") {
                eligible = 0;
                capApplied = 0;
                capReason = "Purchase price is only eligible under the Base stream.";
            } else if (purchaseRatio < 1) {
                eligible = Math.floor(line.amountCadCents * purchaseRatio);
                capApplied = purchasePriceCap;
                capReason = `Purchase price cap: up to CAD ${(purchasePriceCap / 100).toLocaleString("en-CA")} of business value counts.`;
            }
        } else if (line.category === "operating") {
            capReason = `Operating expenses cap: up to ${operatingMonths} months. Verify the monthly amount aligns with the cap.`;
            // We flag but don't auto-reduce (caller must supply monthly breakdown for precision)
        } else if (line.category === "inventory") {
            capReason = `Inventory cap: up to ${inventoryMonths} months of start-up inventory.`;
        }

        return { ...line, eligibleCadCents: eligible, capAppliedCadCents: capApplied, capReason };
    });
}

export function summarizeInvestment(
    lines: InvestmentLineResult[],
    stream: BcpnpStream,
    rules: RuleMap
): InvestmentSummary {
    const minimumCents =
        ruleNumOr(rules, `${stream}.investment_min_cad`, stream === "base" ? 200000 : 100000) *
        100;

    const totalAmountCadCents = lines.reduce((s, l) => s + l.amountCadCents, 0);
    const totalEligibleCadCents = lines.reduce((s, l) => s + l.eligibleCadCents, 0);

    return {
        lines,
        totalAmountCadCents,
        totalEligibleCadCents,
        meetsMinimum: totalEligibleCadCents >= minimumCents,
        minimumCadCents: minimumCents,
    };
}

// ─── FTE job qualification ────────────────────────────────────────────────────

export type JobPlanInput = {
    id: string;
    hoursPerWeek: number;
    annualHours: number;
    isOnSite: boolean;
    isDirectEmployee: boolean;
    shareholderPct: number | null;
};

export type JobQualificationResult = JobPlanInput & {
    qualifiesAsFte: boolean;
    disqualifyingReasons: string[];
};

export function checkJobQualification(
    jobs: JobPlanInput[],
    rules: RuleMap
): JobQualificationResult[] {
    const minHoursWeek = ruleNumOr(rules, "fte.min_hours_per_week", 30);
    const minHoursYear = ruleNumOr(rules, "fte.min_hours_per_year", 1560);

    return jobs.map((job): JobQualificationResult => {
        const reasons: string[] = [];
        if (job.hoursPerWeek < minHoursWeek)
            reasons.push(`Under ${minHoursWeek} hours/week (${job.hoursPerWeek})`);
        if (job.annualHours < minHoursYear)
            reasons.push(`Under ${minHoursYear} hours/year (${job.annualHours})`);
        if (!job.isOnSite) reasons.push("Position is not on-site");
        if (!job.isDirectEmployee) reasons.push("Not a direct employee (contractor)");
        if (job.shareholderPct !== null && job.shareholderPct >= 10)
            reasons.push(`Shareholder (${job.shareholderPct}% ≥ 10%) does not count`);

        return { ...job, qualifiesAsFte: reasons.length === 0, disqualifyingReasons: reasons };
    });
}
