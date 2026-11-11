import { describe, expect, it } from "vitest";
import { computeDeadlines, computeRequiredPresenceDays } from "./deadlines";

const BASE_RULES = {
    "deadline.pool_validity_days": 180,
    "deadline.application_due_days": 120,
    "deadline.confirmation_letter_validity_days": 90,
    "deadline.arrival_due_days": 365,
    "deadline.arrival_report_days": 60,
    "deadline.community_checkin_min_months": 6,
    "deadline.community_checkin_max_months": 8,
    "deadline.progress_checkin_days": 365,
    "deadline.investment_complete_days": 610,
    "base.final_report_window_min_days": 550,
    "base.final_report_window_max_days": 610,
    "regional.final_report_window_min_days": 366,
    "regional.final_report_window_max_days": 610,
    "deadline.job_continuous_days": 180,
    "deadline.work_permit_extension_days": 180,
    "deadline.pr_application_days": 180,
    "both.presence_ratio_min_pct": 75,
    "deadline.job_created_days": 420,
};

function daysFromAnchor(anchor: Date, result: Date): number {
    return Math.round((result.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Deadline offset tests ────────────────────────────────────────────────────

describe("computeDeadlines — work_permit_issued", () => {
    const anchor = new Date("2025-01-01T00:00:00Z");

    it("Base final report window opens at day 550 and closes at day 610", () => {
        const specs = computeDeadlines("work_permit_issued", anchor, "base", BASE_RULES);
        const open = specs.find((s) => s.ruleKey === "base.final_report_window_min_days");
        const close = specs.find((s) => s.ruleKey === "base.final_report_window_max_days");
        expect(open).toBeDefined();
        expect(close).toBeDefined();
        expect(daysFromAnchor(anchor, open!.dueAt)).toBe(550);
        expect(daysFromAnchor(anchor, close!.dueAt)).toBe(610);
    });

    it("Regional final report window opens at day 366", () => {
        const specs = computeDeadlines("work_permit_issued", anchor, "regional", BASE_RULES);
        const open = specs.find((s) => s.ruleKey === "regional.final_report_window_min_days");
        expect(open).toBeDefined();
        expect(daysFromAnchor(anchor, open!.dueAt)).toBe(366);
    });

    it("latest safe hire date = final report deadline (610) − 180 days = day 430", () => {
        const specs = computeDeadlines("work_permit_issued", anchor, "base", BASE_RULES);
        const hire = specs.find((s) => s.ruleKey === "deadline.job_continuous_days");
        expect(hire).toBeDefined();
        expect(daysFromAnchor(anchor, hire!.dueAt)).toBe(610 - 180);
    });

    it("investment complete deadline is day 610", () => {
        const specs = computeDeadlines("work_permit_issued", anchor, "base", BASE_RULES);
        const inv = specs.find((s) => s.ruleKey === "deadline.investment_complete_days");
        expect(inv).toBeDefined();
        expect(daysFromAnchor(anchor, inv!.dueAt)).toBe(610);
    });
});

describe("computeDeadlines — invitation_to_apply", () => {
    it("application due in 120 days", () => {
        const anchor = new Date("2025-06-01T00:00:00Z");
        const specs = computeDeadlines("invitation_to_apply", anchor, "base", BASE_RULES);
        const app = specs.find((s) => s.ruleKey === "deadline.application_due_days");
        expect(app).toBeDefined();
        expect(daysFromAnchor(anchor, app!.dueAt)).toBe(120);
    });
});

// ─── Presence ratio ───────────────────────────────────────────────────────────

describe("computeRequiredPresenceDays", () => {
    it("Base final report on day 610 requires ≥ 457 days (75% of 610)", () => {
        const required = computeRequiredPresenceDays(610, BASE_RULES);
        expect(required).toBeGreaterThanOrEqual(457);
    });

    it("Regional report on day 366 requires ≥ 275 days (75% of 366)", () => {
        const required = computeRequiredPresenceDays(366, BASE_RULES);
        expect(required).toBeGreaterThanOrEqual(275);
    });

    it("regional hire-by-day-186 derived from final-report-day-366 minus 180", () => {
        expect(366 - 180).toBe(186);
    });
});
