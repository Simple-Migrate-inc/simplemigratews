/**
 * BC PNP eligibility screener — pure functions, no database calls.
 *
 * All threshold values come from a RuleMap (loaded from bcpnp_rule rows pinned
 * to the case's guide edition). Values seeded from the May 27, 2024 guide are
 * marked verified = false; re-verify before advising clients.
 *
 * The screener never issues immigration advice. Every result is labelled as an
 * estimate and routes case-specific questions to the licensed consultant.
 */

import type { RuleMap } from "./rules-helpers";
import { ruleNumOr } from "./rules-helpers";
import type { BcpnpStream } from "../db/bcpnp-schema";

export type EligibilityStatus = "pass" | "fail" | "unknown";

export type EligibilityResult = {
    key: string;
    label: string;
    status: EligibilityStatus;
    value: string | null;
    threshold: string;
    reason: string | null;
    fix: string | null;
};

export type EligibilityReport = {
    stream: BcpnpStream;
    overall: EligibilityStatus;
    results: EligibilityResult[];
    meetsPoolMinimum: boolean | null;
};

/** All inputs the screener needs. Null = not yet provided by the applicant. */
export type EligibilityInputs = {
    netWorthCadCents: number | null;
    proposedInvestmentCadCents: number | null;
    proposedOwnershipPct: number | null; // 0–100
    equityInvestmentCadCents: number | null; // only if ownership < threshold
    ownerManagerMonths: number | null;
    seniorManagerMonths: number | null;
    ownerManagerPct: number | null; // ownership % during owner-manager period
    seniorManagerDirectReports: number | null;
    hasPostSecondary: boolean | null;
    selfEmployedMonthsLast60: number | null; // months running 100%-owned biz
    languageTestType: string | null; // ielts | celpip | tef
    languageScores: { listening: number; reading: number; writing: number; speaking: number } | null;
    hasExploratoryVisit: boolean | null; // Regional
    hasCommunityReferral: boolean | null; // Regional
    residenceWithinKm: boolean | null; // Base
    noLongFerry: boolean | null; // Base
    residenceInsideCommunity: boolean | null; // Regional
    businessType: string | null; // new | purchase | franchise_new_location
    currentOwnerOperatedMonths: number | null; // for purchase: how long current owner ran it
    numExistingJobs: number | null; // for purchase
    numPlannedFteJobs: number | null; // FTE jobs for citizens/PR, not shareholders
};

// ─── CLB 4 minimum scores by test ────────────────────────────────────────────

const CLB4: Record<string, { listening: number; reading: number; writing: number; speaking: number }> = {
    ielts: { listening: 4.5, reading: 3.5, writing: 4.0, speaking: 4.0 },
    celpip: { listening: 4, reading: 4, writing: 4, speaking: 4 },
    tef: { listening: 145, reading: 121, writing: 181, speaking: 181 },
};

function clbPass(type: string, scores: EligibilityInputs["languageScores"]): boolean {
    if (!scores) return false;
    const mins = CLB4[type.toLowerCase()];
    if (!mins) return false;
    return (
        scores.listening >= mins.listening &&
        scores.reading >= mins.reading &&
        scores.writing >= mins.writing &&
        scores.speaking >= mins.speaking
    );
}

// ─── Experience helper ────────────────────────────────────────────────────────

/**
 * Returns true when the applicant's experience meets the BC PNP requirement:
 *   > 36 months owner-manager (≥ 10% ownership), OR
 *   > 48 months senior manager (≥ 3 direct reports), OR
 *   ≥ 12 months owner-manager + ≥ 24 months senior manager.
 * Look-back window is enforced by the caller (not checked here as it requires date logic).
 */
export function experiencePasses(
    ownerMgrMonths: number,
    seniorMgrMonths: number,
    ownerMgrPct: number,
    seniorMgrReports: number
): boolean {
    const qualifiedOwner = ownerMgrPct >= 10 && ownerMgrMonths > 36;
    const qualifiedSenior = seniorMgrReports >= 3 && seniorMgrMonths > 48;
    const combined =
        ownerMgrPct >= 10 && ownerMgrMonths >= 12 && seniorMgrReports >= 3 && seniorMgrMonths >= 24;
    return qualifiedOwner || qualifiedSenior || combined;
}

// ─── Main screener ────────────────────────────────────────────────────────────

export function runEligibilityScreener(
    stream: BcpnpStream,
    inputs: EligibilityInputs,
    rules: RuleMap
): EligibilityReport {
    const results: EligibilityResult[] = [];

    const isCents = (c: number | null) =>
        c !== null ? `CAD ${(c / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}` : null;

    // Helper: produce one result
    function check(
        key: string,
        label: string,
        passed: boolean | null, // null = unknown (data not provided)
        value: string | null,
        threshold: string,
        reason: string | null,
        fix: string | null
    ): EligibilityResult {
        const status: EligibilityStatus = passed === null ? "unknown" : passed ? "pass" : "fail";
        return { key, label, status, value, threshold, reason, fix };
    }

    // ── 1. Personal net worth ─────────────────────────────────────────────────
    const nwMin = ruleNumOr(rules, `${stream}.net_worth_min_cad`, stream === "base" ? 600000 : 300000);
    const nwCad = inputs.netWorthCadCents !== null ? inputs.netWorthCadCents / 100 : null;
    results.push(
        check(
            "net_worth",
            "Personal net worth",
            nwCad !== null ? nwCad >= nwMin : null,
            isCents(inputs.netWorthCadCents),
            `≥ CAD ${nwMin.toLocaleString("en-CA")}`,
            nwCad !== null && nwCad < nwMin
                ? `Net worth of CAD ${nwCad.toLocaleString("en-CA")} is below the minimum.`
                : null,
            "Review all includable assets with your accountant. See the net worth report guidelines."
        )
    );

    // ── 2. Eligible investment ────────────────────────────────────────────────
    const invMin = ruleNumOr(
        rules,
        `${stream}.investment_min_cad`,
        stream === "base" ? 200000 : 100000
    );
    const invCad = inputs.proposedInvestmentCadCents !== null ? inputs.proposedInvestmentCadCents / 100 : null;
    results.push(
        check(
            "investment",
            "Eligible personal investment",
            invCad !== null ? invCad >= invMin : null,
            isCents(inputs.proposedInvestmentCadCents),
            `≥ CAD ${invMin.toLocaleString("en-CA")} from personal net worth`,
            invCad !== null && invCad < invMin
                ? `Proposed investment of CAD ${invCad.toLocaleString("en-CA")} is below the minimum.`
                : null,
            "External financing and grants do not count toward the minimum. All funds must be from personal net worth."
        )
    );

    // ── 3. Ownership ──────────────────────────────────────────────────────────
    const ownMin = ruleNumOr(
        rules,
        `${stream}.ownership_min_pct`,
        stream === "base" ? 33.33 : 51.0
    );
    const largeEquityMin = ruleNumOr(rules, "base.large_equity_investment_min_cad", 1000000);
    const ownPct = inputs.proposedOwnershipPct;
    let ownPass: boolean | null = null;
    let ownReason: string | null = null;

    if (ownPct !== null) {
        if (ownPct >= ownMin) {
            ownPass = true;
        } else if (stream === "base") {
            // Base allows <33.33% if equity investment ≥ $1M
            const equityCad =
                inputs.equityInvestmentCadCents !== null
                    ? inputs.equityInvestmentCadCents / 100
                    : null;
            if (equityCad !== null && equityCad >= largeEquityMin) {
                ownPass = true;
            } else {
                ownPass = false;
                ownReason = `Ownership of ${ownPct}% is below the ${ownMin}% minimum. For Base stream, an equity investment of ≥ CAD ${largeEquityMin.toLocaleString("en-CA")} can substitute, but that threshold is not met.`;
            }
        } else {
            ownPass = false;
            ownReason = `Regional stream requires ≥ ${ownMin}% ownership. No exemption is available.`;
        }
    }

    results.push(
        check(
            "ownership",
            "Minimum ownership",
            ownPass,
            ownPct !== null ? `${ownPct}%` : null,
            stream === "base"
                ? `≥ ${ownMin}% (or < ${ownMin}% with ≥ CAD ${largeEquityMin.toLocaleString("en-CA")} equity)`
                : `≥ ${ownMin}%`,
            ownReason,
            "Review the ownership structure with your business lawyer and consultant."
        )
    );

    // ── 4. Jobs ───────────────────────────────────────────────────────────────
    const jobsMin = ruleNumOr(rules, `${stream}.jobs_min`, 1);
    results.push(
        check(
            "jobs",
            "Full-time equivalent jobs for citizens/PR",
            inputs.numPlannedFteJobs !== null ? inputs.numPlannedFteJobs >= jobsMin : null,
            inputs.numPlannedFteJobs !== null ? `${inputs.numPlannedFteJobs} FTE` : null,
            `≥ ${jobsMin} on-site FTE for a Canadian citizen or permanent resident`,
            inputs.numPlannedFteJobs !== null && inputs.numPlannedFteJobs < jobsMin
                ? "No qualifying job in the plan. The job must be ≥ 30 hrs/week, ≥ 1,560 hrs/year, on-site, and held by a Canadian citizen or PR who owns < 10% of the business."
                : null,
            "Review the full-time equivalent definition. Contractors, remote workers, and shareholders (≥ 10%) do not count."
        )
    );

    // ── 5. Experience ─────────────────────────────────────────────────────────
    const omMonths = inputs.ownerManagerMonths ?? 0;
    const smMonths = inputs.seniorManagerMonths ?? 0;
    const omPct = inputs.ownerManagerPct ?? 0;
    const smReports = inputs.seniorManagerDirectReports ?? 0;
    const expDataProvided =
        inputs.ownerManagerMonths !== null ||
        inputs.seniorManagerMonths !== null;

    const expPass = expDataProvided
        ? experiencePasses(omMonths, smMonths, omPct, smReports)
        : null;

    results.push(
        check(
            "experience",
            "Business management experience",
            expPass,
            expDataProvided
                ? `${omMonths} mo owner-manager (${omPct}%), ${smMonths} mo senior manager (${smReports} reports)`
                : null,
            "> 36 mo owner-manager (≥ 10%), OR > 48 mo senior manager (≥ 3 reports), OR ≥ 12 + ≥ 24 combined",
            !expPass && expDataProvided
                ? "Experience does not meet any qualifying path. Review the combinations."
                : null,
            "Experience must fall within the last 120 months (Base) or 60 months (Regional). Self-employment counts only with proof of ownership and operation."
        )
    );

    // ── 6. Education ──────────────────────────────────────────────────────────
    const eduMonths = ruleNumOr(rules, "both.education_own_business_months", 36);
    const selfEmpMonths = inputs.selfEmployedMonthsLast60 ?? 0;
    const eduPass =
        inputs.hasPostSecondary !== null
            ? inputs.hasPostSecondary ||
              (inputs.selfEmployedMonthsLast60 !== null && selfEmpMonths >= eduMonths)
            : null;

    results.push(
        check(
            "education",
            "Education",
            eduPass,
            inputs.hasPostSecondary !== null
                ? inputs.hasPostSecondary
                    ? "Post-secondary credential"
                    : `${selfEmpMonths} of last 60 months running a 100%-owned business`
                : null,
            "Post-secondary credential, OR ≥ 36 of last 60 months running a 100%-owned business",
            !eduPass && inputs.hasPostSecondary !== null
                ? "Neither criterion is met."
                : null,
            "Contact your consultant to discuss acceptable credential equivalencies."
        )
    );

    // ── 7. Language ───────────────────────────────────────────────────────────
    const langRequired = stream === "regional"; // proof due at registration for Regional
    let langPass: boolean | null = null;
    let langValue: string | null = null;

    if (inputs.languageTestType && inputs.languageScores) {
        langPass = clbPass(inputs.languageTestType, inputs.languageScores);
        const s = inputs.languageScores;
        langValue = `${inputs.languageTestType.toUpperCase()}: L${s.listening} R${s.reading} W${s.writing} S${s.speaking}`;
    }

    results.push(
        check(
            "language",
            stream === "regional"
                ? "Language (CLB 4 — required at registration)"
                : "Language (CLB 4 — required by final report)",
            langPass,
            langValue,
            "CLB 4 in all four skills (listening, reading, writing, speaking)",
            langPass === false
                ? "One or more scores are below CLB 4 for the test type provided."
                : null,
            langRequired
                ? "Regional stream: proof must be submitted at registration. If your test has expired (> 24 months), you must retest."
                : "Base stream: proof is due by the final report. Plan ahead — IELTS/CELPIP/TEF results are valid 24 months."
        )
    );

    // ── 8. Residence ──────────────────────────────────────────────────────────
    if (stream === "base") {
        const resPass =
            inputs.residenceWithinKm !== null && inputs.noLongFerry !== null
                ? inputs.residenceWithinKm && inputs.noLongFerry
                : null;
        results.push(
            check(
                "residence",
                "Residence proximity to business",
                resPass,
                resPass !== null ? (resPass ? "Within 50 km, no long ferry" : "Does not meet requirement") : null,
                "Within 50 km by road; no ferry leg over 30 minutes",
                resPass === false
                    ? "Home address must be within 50 km by road of the business, with no single ferry leg over 30 minutes."
                    : null,
                "Confirm road distance using a mapping tool. Ferry routes are assessed individually."
            )
        );
    } else {
        results.push(
            check(
                "residence",
                "Residence inside enrolled community",
                inputs.residenceInsideCommunity,
                inputs.residenceInsideCommunity !== null
                    ? inputs.residenceInsideCommunity
                        ? "Inside community boundaries"
                        : "Outside community boundaries"
                    : null,
                "Must reside inside the enrolled community's boundaries",
                inputs.residenceInsideCommunity === false
                    ? "Regional stream requires residence inside the community."
                    : null,
                "Check the community's exact boundary definition with the community contact."
            )
        );
    }

    // ── 9. Exploratory visit (Regional mandatory) ─────────────────────────────
    if (stream === "regional") {
        results.push(
            check(
                "exploratory_visit",
                "Exploratory visit (mandatory for Regional)",
                inputs.hasExploratoryVisit,
                inputs.hasExploratoryVisit !== null
                    ? inputs.hasExploratoryVisit
                        ? "Completed"
                        : "Not completed"
                    : null,
                "Mandatory for Regional stream",
                inputs.hasExploratoryVisit === false
                    ? "An in-person exploratory visit is required before registration."
                    : null,
                "Contact the community to arrange the visit and obtain the referral letter."
            )
        );

        results.push(
            check(
                "community_referral",
                "Community referral letter",
                inputs.hasCommunityReferral,
                inputs.hasCommunityReferral !== null
                    ? inputs.hasCommunityReferral
                        ? "Obtained"
                        : "Not obtained"
                    : null,
                "Required before registration (valid 90 days)",
                inputs.hasCommunityReferral === false
                    ? "A referral letter from the enrolled community is required."
                    : null,
                "The referral letter is valid for 90 days from issue. Time your registration accordingly."
            )
        );
    }

    // ── 10. Base purchase rules ───────────────────────────────────────────────
    if (stream === "base" && inputs.businessType === "purchase") {
        const minOwnedMonths = ruleNumOr(rules, "base.purchase_min_operating_months", 60);
        results.push(
            check(
                "purchase_operating",
                "Current owner operation period",
                inputs.currentOwnerOperatedMonths !== null
                    ? inputs.currentOwnerOperatedMonths >= minOwnedMonths
                    : null,
                inputs.currentOwnerOperatedMonths !== null
                    ? `${inputs.currentOwnerOperatedMonths} months`
                    : null,
                `Current owner must have operated ≥ ${minOwnedMonths} months`,
                inputs.currentOwnerOperatedMonths !== null &&
                    inputs.currentOwnerOperatedMonths < minOwnedMonths
                    ? `Current owner has operated for ${inputs.currentOwnerOperatedMonths} months, below the ${minOwnedMonths}-month minimum.`
                    : null,
                "Obtain proof of continuous operation from the seller (financial statements, tax returns)."
            )
        );
    }

    // ── Determine overall ─────────────────────────────────────────────────────
    const statuses = results.map((r) => r.status);
    const overall: EligibilityStatus = statuses.includes("fail")
        ? "fail"
        : statuses.includes("unknown")
          ? "unknown"
          : "pass";

    return { stream, overall, results, meetsPoolMinimum: null };
}
