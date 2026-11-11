/**
 * BC PNP deadline engine — pure functions, no database calls.
 *
 * Given an anchor event key and date, produces the set of deadlines that must
 * be created or updated. The caller writes them to bcpnp_deadline.
 *
 * All offsets from the May 27, 2024 BC PNP guide (verified = false).
 */

import type { RuleMap } from "./rules-helpers";
import { ruleNumOr } from "./rules-helpers";
import type { BcpnpStream } from "../db/bcpnp-schema";

export type DeadlineSpec = {
    ruleKey: string;
    label: string;
    dueAt: Date;
    /** Lead-time reminder days before dueAt. */
    reminderDays: number[];
};

/** Returns a new Date offset by `days` from `anchor`. */
function addDays(anchor: Date, days: number): Date {
    const d = new Date(anchor.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}

/** Returns a new Date offset by `months` from `anchor`. */
function addMonths(anchor: Date, months: number): Date {
    const d = new Date(anchor.getTime());
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
}

/**
 * Compute deadlines triggered by a specific anchor event.
 *
 * Returns an empty array when the event is not an anchor for any deadline,
 * allowing callers to safely call this for every event.
 */
export function computeDeadlines(
    eventKey: string,
    occurredAt: Date,
    stream: BcpnpStream,
    rules: RuleMap
): DeadlineSpec[] {
    const specs: DeadlineSpec[] = [];

    switch (eventKey) {
        case "registration_submitted": {
            // Pool validity: 180 days from registration
            const poolDays = ruleNumOr(rules, "deadline.pool_validity_days", 180);
            specs.push({
                ruleKey: "deadline.pool_validity_days",
                label: "Pool validity expires",
                dueAt: addDays(occurredAt, poolDays),
                reminderDays: [30, 14],
            });
            break;
        }

        case "invitation_to_apply": {
            const appDays = ruleNumOr(rules, "deadline.application_due_days", 120);
            specs.push({
                ruleKey: "deadline.application_due_days",
                label: "Application due",
                dueAt: addDays(occurredAt, appDays),
                reminderDays: [60, 30, 14, 7],
            });
            break;
        }

        case "confirmation_letter_issued": {
            const clvDays = ruleNumOr(rules, "deadline.confirmation_letter_validity_days", 90);
            specs.push({
                ruleKey: "deadline.confirmation_letter_validity_days",
                label: "Confirmation letter expires",
                dueAt: addDays(occurredAt, clvDays),
                reminderDays: [30, 14],
            });
            const arrDays = ruleNumOr(rules, "deadline.arrival_due_days", 365);
            specs.push({
                ruleKey: "deadline.arrival_due_days",
                label: "Arrival in B.C. due",
                dueAt: addDays(occurredAt, arrDays),
                reminderDays: [90, 30, 14],
            });
            break;
        }

        case "arrival": {
            const arrReportDays = ruleNumOr(rules, "deadline.arrival_report_days", 60);
            specs.push({
                ruleKey: "deadline.arrival_report_days",
                label: "Arrival report due",
                dueAt: addDays(occurredAt, arrReportDays),
                reminderDays: [21, 7],
            });
            const jobCreatedDays = ruleNumOr(rules, "deadline.job_created_days", 420);
            specs.push({
                ruleKey: "deadline.job_created_days",
                label: "Required job(s) must be created",
                dueAt: addDays(occurredAt, jobCreatedDays),
                reminderDays: [90, 30],
            });
            if (stream === "regional") {
                const checkinMinMonths = ruleNumOr(rules, "deadline.community_checkin_min_months", 6);
                const checkinMaxMonths = ruleNumOr(rules, "deadline.community_checkin_max_months", 8);
                specs.push({
                    ruleKey: "deadline.community_checkin_min_months",
                    label: `Community check-in window (${checkinMinMonths}–${checkinMaxMonths} months after arrival)`,
                    dueAt: addMonths(occurredAt, checkinMaxMonths),
                    reminderDays: [
                        Math.floor(
                            (checkinMaxMonths - checkinMinMonths) * 30 + 14
                        ),
                        14,
                    ],
                });
            }
            break;
        }

        case "work_permit_issued": {
            const progressDays = ruleNumOr(rules, "deadline.progress_checkin_days", 365);
            specs.push({
                ruleKey: "deadline.progress_checkin_days",
                label: "Progress check-in due",
                dueAt: addDays(occurredAt, progressDays),
                reminderDays: [30, 14],
            });
            const invCompleteDays = ruleNumOr(rules, "deadline.investment_complete_days", 610);
            specs.push({
                ruleKey: "deadline.investment_complete_days",
                label: "Investment must be complete",
                dueAt: addDays(occurredAt, invCompleteDays),
                reminderDays: [180, 90, 30],
            });
            const finalMin =
                stream === "base"
                    ? ruleNumOr(rules, "base.final_report_window_min_days", 550)
                    : ruleNumOr(rules, "regional.final_report_window_min_days", 366);
            const finalMax =
                stream === "base"
                    ? ruleNumOr(rules, "base.final_report_window_max_days", 610)
                    : ruleNumOr(rules, "regional.final_report_window_max_days", 610);
            specs.push({
                ruleKey: `${stream}.final_report_window_min_days`,
                label: `Final report window opens (day ${finalMin})`,
                dueAt: addDays(occurredAt, finalMin),
                reminderDays: [30, 14],
            });
            specs.push({
                ruleKey: `${stream}.final_report_window_max_days`,
                label: `Final report deadline (day ${finalMax})`,
                dueAt: addDays(occurredAt, finalMax),
                reminderDays: [60, 30, 14, 7],
            });
            // Derived: latest safe hire date = planned final report date − 180 days
            // We use the mid-point of the window as the planned final report date.
            const jobContinuousDays = ruleNumOr(rules, "deadline.job_continuous_days", 180);
            const latestHireDays = finalMax - jobContinuousDays;
            specs.push({
                ruleKey: "deadline.job_continuous_days",
                label: `Latest safe hire date (${jobContinuousDays} days before final report deadline)`,
                dueAt: addDays(occurredAt, latestHireDays),
                reminderDays: [30, 14],
            });
            // Work permit extension warning
            const wpExtDays = ruleNumOr(rules, "deadline.work_permit_extension_days", 180);
            specs.push({
                ruleKey: "deadline.work_permit_extension_days",
                label: "Request work permit extension (if ≤ 180 days remain)",
                dueAt: addDays(occurredAt, finalMax - wpExtDays),
                reminderDays: [30],
            });
            break;
        }

        case "nomination_confirmed": {
            const prDays = ruleNumOr(rules, "deadline.pr_application_days", 180);
            specs.push({
                ruleKey: "deadline.pr_application_days",
                label: "Permanent residence application due",
                dueAt: addDays(occurredAt, prDays),
                reminderDays: [60, 30, 14],
            });
            break;
        }
    }

    return specs;
}

/** BC PNP presence requirement: ≥ 75% of days in B.C. during the work permit period. */
export function computeRequiredPresenceDays(totalDays: number, rules: RuleMap): number {
    const pct = ruleNumOr(rules, "both.presence_ratio_min_pct", 75) / 100;
    return Math.ceil(totalDays * pct);
}
