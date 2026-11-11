/**
 * BC PNP rule library seed data — May 27, 2024 guide edition.
 *
 * All rows are seeded with verified = false. Re-verify every value against
 * the current official BC PNP guide before advising any client.
 * Source: https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration
 */

import type { BcpnpStream } from "../db/bcpnp-schema";

type RuleSeed = {
    stream: BcpnpStream | null;
    key: string;
    valueNum?: number;
    valueText?: string;
    valueJson?: unknown;
    unit?: string;
    description: string;
};

export const GUIDE_EDITION = {
    code: "2024-05-27",
    label: "BC PNP Entrepreneur Immigration Guide — May 27, 2024",
    effectiveFrom: new Date("2024-05-27T00:00:00Z"),
};

export const RULES: RuleSeed[] = [
    // ── Stream requirements ──────────────────────────────────────────────────

    { stream: "base", key: "base.net_worth_min_cad", valueNum: 600000, unit: "cad", description: "Minimum personal net worth (Base)" },
    { stream: "base", key: "base.investment_min_cad", valueNum: 200000, unit: "cad", description: "Minimum eligible personal investment (Base)" },
    { stream: "base", key: "base.ownership_min_pct", valueNum: 33.33, unit: "percentage", description: "Minimum ownership percentage (Base)" },
    { stream: "base", key: "base.large_equity_investment_min_cad", valueNum: 1000000, unit: "cad", description: "Equity investment to substitute for lower ownership (Base)" },
    { stream: "base", key: "base.jobs_min", valueNum: 1, unit: "count", description: "Minimum FTE jobs for citizens/PR (Base)" },
    { stream: "base", key: "base.experience_lookback_months", valueNum: 120, unit: "months", description: "Experience look-back window (Base)" },
    { stream: "base", key: "base.pool_min_score", valueNum: 115, unit: "count", description: "Minimum pool entry score (Base)" },
    { stream: "base", key: "base.pool_min_concept_score", valueNum: 40, unit: "count", description: "Minimum concept score for pool entry (Base)" },
    { stream: "base", key: "base.final_report_window_min_days", valueNum: 550, unit: "days", description: "Final report window opens (days after work permit issued, Base)" },
    { stream: "base", key: "base.final_report_window_max_days", valueNum: 610, unit: "days", description: "Final report deadline (days after work permit issued, Base)" },
    { stream: "base", key: "base.purchase_min_operating_months", valueNum: 60, unit: "months", description: "Minimum months current owner operated the business (Base purchase)" },
    { stream: "base", key: "base.purchase_min_improvement_cad", valueNum: 50000, unit: "cad", description: "Minimum buyer improvement/expansion investment (Base purchase)" },
    { stream: "base", key: "base.purchase_price_max_cad", valueNum: 150000, unit: "cad", description: "Maximum of purchase price that counts as eligible investment (Base)" },

    { stream: "regional", key: "regional.net_worth_min_cad", valueNum: 300000, unit: "cad", description: "Minimum personal net worth (Regional)" },
    { stream: "regional", key: "regional.investment_min_cad", valueNum: 100000, unit: "cad", description: "Minimum eligible personal investment (Regional)" },
    { stream: "regional", key: "regional.ownership_min_pct", valueNum: 51, unit: "percentage", description: "Minimum ownership percentage (Regional)" },
    { stream: "regional", key: "regional.jobs_min", valueNum: 1, unit: "count", description: "Minimum FTE jobs for citizens/PR (Regional)" },
    { stream: "regional", key: "regional.experience_lookback_months", valueNum: 60, unit: "months", description: "Experience look-back window (Regional)" },
    { stream: "regional", key: "regional.pool_min_score", valueNum: 105, unit: "count", description: "Minimum pool entry score (Regional)" },
    { stream: "regional", key: "regional.pool_min_concept_score", valueNum: 0, unit: "count", description: "Minimum concept score for pool entry (Regional, no separate minimum)" },
    { stream: "regional", key: "regional.final_report_window_min_days", valueNum: 366, unit: "days", description: "Final report window opens (days after work permit issued, Regional)" },
    { stream: "regional", key: "regional.final_report_window_max_days", valueNum: 610, unit: "days", description: "Final report deadline (days after work permit issued, both streams)" },

    // ── Experience (both streams) ────────────────────────────────────────────

    { stream: null, key: "both.experience_owner_manager_months", valueNum: 36, unit: "months", description: "Months owner-manager experience required (> 36, path 1)" },
    { stream: null, key: "both.experience_senior_manager_months", valueNum: 48, unit: "months", description: "Months senior manager experience required (> 48, path 2)" },
    { stream: null, key: "both.experience_combined_owner_months", valueNum: 12, unit: "months", description: "Combined path: minimum owner-manager months (≥ 12)" },
    { stream: null, key: "both.experience_combined_senior_months", valueNum: 24, unit: "months", description: "Combined path: minimum senior manager months (≥ 24)" },
    { stream: null, key: "both.experience_owner_manager_min_pct", valueNum: 10, unit: "percentage", description: "Minimum ownership percentage for owner-manager path" },
    { stream: null, key: "both.experience_senior_manager_min_reports", valueNum: 3, unit: "count", description: "Minimum direct reports for senior manager path" },

    // ── Education (both streams) ─────────────────────────────────────────────

    { stream: null, key: "both.education_own_business_months", valueNum: 36, unit: "months", description: "Months running 100%-owned business (education alternative)" },
    { stream: null, key: "both.education_own_business_lookback_months", valueNum: 60, unit: "months", description: "Look-back window for self-employment education alternative" },
    { stream: null, key: "both.education_own_business_ownership_pct", valueNum: 100, unit: "percentage", description: "Ownership required for self-employment education alternative" },

    // ── Language (both streams) ──────────────────────────────────────────────

    { stream: null, key: "both.language_clb_min", valueNum: 4, unit: "count", description: "Minimum Canadian Language Benchmark (CLB 4 all four skills)" },
    {
        stream: null,
        key: "language.clb4_ielts",
        valueJson: { listening: 4.5, reading: 3.5, writing: 4.0, speaking: 4.0 },
        description: "CLB 4 minimum scores — IELTS General Training",
    },
    {
        stream: null,
        key: "language.clb4_celpip",
        valueJson: { listening: 4, reading: 4, writing: 4, speaking: 4 },
        description: "CLB 4 minimum scores — CELPIP-General",
    },
    {
        stream: null,
        key: "language.clb4_tef",
        valueJson: { listening: 145, reading: 121, writing: 181, speaking: 181 },
        description: "CLB 4 minimum scores — TEF Canada",
    },
    { stream: null, key: "deadline.language_test_validity_months", valueNum: 24, unit: "months", description: "Language test results validity" },

    // ── Residence (both streams) ─────────────────────────────────────────────

    { stream: "base", key: "both.residence_max_road_km", valueNum: 50, unit: "count", description: "Maximum road distance home-to-business (km, Base)" },
    { stream: "base", key: "both.residence_max_ferry_minutes", valueNum: 30, unit: "count", description: "Maximum single ferry leg duration (minutes, Base)" },

    // ── Investment caps (both streams) ───────────────────────────────────────

    { stream: null, key: "inv_cap.operating_months_new", valueNum: 6, unit: "months", description: "Max months of operating expenses eligible (new business)" },
    { stream: null, key: "inv_cap.operating_months_purchased", valueNum: 3, unit: "months", description: "Max months of operating expenses eligible (purchased business or new franchise)" },
    { stream: null, key: "inv_cap.inventory_months", valueNum: 3, unit: "months", description: "Max months of start-up inventory eligible" },
    { stream: null, key: "inv_cap.vehicle_max_cad", valueNum: 15000, unit: "cad", description: "Maximum vehicle investment eligible (must be essential)" },

    // ── FTE definition (both streams) ────────────────────────────────────────

    { stream: null, key: "fte.min_hours_per_week", valueNum: 30, unit: "count", description: "Minimum hours per week for a full-time equivalent position" },
    { stream: null, key: "fte.min_hours_per_year", valueNum: 1560, unit: "count", description: "Minimum hours per year for a full-time equivalent position" },

    // ── Deadline offsets ─────────────────────────────────────────────────────

    { stream: null, key: "deadline.photo_age_months", valueNum: 6, unit: "months", description: "Maximum age of passport-style photos" },
    { stream: null, key: "deadline.rep_form_age_months", valueNum: 6, unit: "months", description: "Maximum age of representative form before registration" },
    { stream: "regional", key: "deadline.referral_validity_days", valueNum: 90, unit: "days", description: "Community referral letter validity (Regional)" },
    { stream: "base", key: "deadline.coregistrant_window_days", valueNum: 30, unit: "days", description: "Window to submit co-registrant after first registration (Base)" },
    { stream: null, key: "deadline.draft_inactivity_days", valueNum: 30, unit: "days", description: "Draft application inactivity before it may be cancelled" },
    { stream: null, key: "deadline.pool_validity_days", valueNum: 180, unit: "days", description: "Pool entry validity" },
    { stream: null, key: "deadline.application_due_days", valueNum: 120, unit: "days", description: "Days from invitation-to-apply to application deadline" },
    { stream: null, key: "deadline.net_worth_report_validity_months", valueNum: 12, unit: "months", description: "Net worth report validity after issue date" },
    { stream: null, key: "deadline.confirmation_letter_validity_days", valueNum: 90, unit: "days", description: "Performance agreement / confirmation letter validity" },
    { stream: null, key: "deadline.arrival_due_days", valueNum: 365, unit: "days", description: "Days from confirmation letter to required arrival in B.C." },
    { stream: null, key: "deadline.arrival_report_days", valueNum: 60, unit: "days", description: "Days from arrival (or agreement signing if later) to arrival report" },
    { stream: "regional", key: "deadline.community_checkin_min_months", valueNum: 6, unit: "months", description: "Community check-in window opens (months after arrival, Regional)" },
    { stream: "regional", key: "deadline.community_checkin_max_months", valueNum: 8, unit: "months", description: "Community check-in window closes (months after arrival, Regional)" },
    { stream: "base", key: "deadline.progress_checkin_days", valueNum: 365, unit: "days", description: "Progress check-in due (days after work permit issued, Base)" },
    { stream: null, key: "deadline.job_created_days", valueNum: 420, unit: "days", description: "Required job(s) must be created by this day after arrival" },
    { stream: null, key: "deadline.job_continuous_days", valueNum: 180, unit: "days", description: "Job must be continuously employed this many days before final report" },
    { stream: null, key: "deadline.investment_complete_days", valueNum: 610, unit: "days", description: "Investment must be complete by this day after arrival" },
    { stream: null, key: "deadline.pr_application_days", valueNum: 180, unit: "days", description: "Days from nomination to permanent residence application" },
    { stream: null, key: "deadline.absence_notice_weeks", valueNum: 3, unit: "count", description: "Report absences over this many weeks (after nomination)" },
    { stream: null, key: "deadline.review_request_days_in_canada", valueNum: 30, unit: "days", description: "Days to request decision review (if in Canada)" },
    { stream: null, key: "deadline.review_request_days_outside_canada", valueNum: 60, unit: "days", description: "Days to request decision review (if outside Canada)" },
    { stream: null, key: "deadline.work_permit_extension_days", valueNum: 180, unit: "days", description: "Request extension when this many days remain on work permit" },
    { stream: null, key: "both.presence_ratio_min_pct", valueNum: 75, unit: "percentage", description: "Minimum percentage of days that must be spent in B.C." },

    // ── Scoring structure (stored as JSON for the score UI) ──────────────────

    {
        stream: "base",
        key: "score.base.self_declared",
        valueJson: { total: 120, experience: 24, net_worth: 12, investment: 20, jobs: 12, region: 12, adaptability: 40 },
        description: "Self-declared score section maximums (Base)",
    },
    {
        stream: "base",
        key: "score.base.concept",
        valueJson: { total: 80, viability: 30, skills: 15, economic_benefit: 35 },
        description: "Concept score section maximums (Base)",
    },
    {
        stream: "regional",
        key: "score.regional.self_declared",
        valueJson: { total: 140, experience: 24, net_worth: 6, investment: 10, jobs: 15, community_population: 6, region: 12, adaptability: 67 },
        description: "Self-declared score section maximums (Regional)",
    },
    {
        stream: "regional",
        key: "score.regional.concept",
        valueJson: { total: 60, viability: 30, skills: 15, economic_benefit: 15 },
        description: "Concept score section maximums (Regional)",
    },
];
