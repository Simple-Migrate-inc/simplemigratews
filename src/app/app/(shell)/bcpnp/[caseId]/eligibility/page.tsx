import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import InfoNotice from "@dashboard-ui/info-notice";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { openBcpnpCase } from "@dashboard/bcpnp/access";
import { db, bcpnpSchema } from "@dashboard/db";
import { loadRules } from "@dashboard/bcpnp/rules";
import { runEligibilityScreener } from "@dashboard/bcpnp/eligibility";
import type { EligibilityInputs, EligibilityReport } from "@dashboard/bcpnp/eligibility";
import type { PillTone } from "@dashboard-ui/status-pill";

export const metadata: Metadata = { title: "Eligibility" };
export const dynamic = "force-dynamic";

const OVERALL_TONE: Record<string, PillTone> = {
    pass: "success",
    fail: "danger",
    unknown: "warning",
};

const STATUS_TONE: Record<string, PillTone> = {
    pass: "success",
    fail: "danger",
    unknown: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
    pass: "Meets requirement",
    fail: "Does not meet requirement",
    unknown: "Information needed",
};

export default async function EligibilityPage({
    params,
}: {
    params: { caseId: string };
}) {
    const user = await requireUser({ area: "candidate" });
    await requireBcpnp("/app");

    const opened = await openBcpnpCase(user, params.caseId);
    if (!opened) notFound();

    const c = opened.case;

    const [profile, concept] = await Promise.all([
        db()
            .select()
            .from(bcpnpSchema.bcpnpApplicantProfile)
            .where(eq(bcpnpSchema.bcpnpApplicantProfile.caseId, c.id))
            .limit(1)
            .then((r) => r[0] ?? null),
        db()
            .select()
            .from(bcpnpSchema.bcpnpBusinessConcept)
            .where(eq(bcpnpSchema.bcpnpBusinessConcept.caseId, c.id))
            .orderBy(desc(bcpnpSchema.bcpnpBusinessConcept.version))
            .limit(1)
            .then((r) => r[0] ?? null),
    ]);

    // Count planned FTE jobs from job plan rows
    let numPlannedFteJobs: number | null = null;
    if (concept) {
        const jobs = await db()
            .select()
            .from(bcpnpSchema.bcpnpJobPlan)
            .where(eq(bcpnpSchema.bcpnpJobPlan.conceptId, concept.id));
        numPlannedFteJobs = jobs.length;
    }

    let report: EligibilityReport | null = null;

    if (profile && c.stream && c.guideEditionId) {
        const rules = await loadRules(c.guideEditionId, c.stream);

        const inputs: EligibilityInputs = {
            netWorthCadCents: profile.netWorthCadCents ?? null,
            proposedInvestmentCadCents: profile.proposedInvestmentCadCents ?? null,
            proposedOwnershipPct: profile.proposedOwnershipPct !== null ? Number(profile.proposedOwnershipPct) : null,
            equityInvestmentCadCents: profile.equityInvestmentCadCents ?? null,
            ownerManagerMonths: profile.ownerManagerMonths ?? null,
            seniorManagerMonths: profile.seniorManagerMonths ?? null,
            ownerManagerPct: profile.ownerManagerPct !== null ? Number(profile.ownerManagerPct) : null,
            seniorManagerDirectReports: profile.seniorManagerDirectReports ?? null,
            hasPostSecondary: profile.hasPostSecondary ?? null,
            selfEmployedMonthsLast60: profile.selfEmployedMonthsLast60 ?? null,
            languageTestType: profile.languageTestType ?? null,
            languageScores: (profile.languageScores as EligibilityInputs["languageScores"]) ?? null,
            hasExploratoryVisit: profile.hasExploratoryVisit ?? null,
            hasCommunityReferral: profile.hasCommunityReferral ?? null,
            residenceWithinKm: profile.residenceWithinKm ?? null,
            noLongFerry: profile.noLongFerry ?? null,
            residenceInsideCommunity: profile.residenceInsideCommunity ?? null,
            businessType: profile.businessType ?? null,
            currentOwnerOperatedMonths: profile.currentOwnerOperatedMonths ?? null,
            numExistingJobs: concept?.numExistingJobsToMaintain ?? null,
            numPlannedFteJobs,
        };

        report = runEligibilityScreener(c.stream, inputs, rules);
    }

    return (
        <>
            <PageHeader
                title="Eligibility Assessment"
                description="Your preliminary eligibility for the BC PNP Entrepreneur stream."
            />

            <InfoNotice />

            <div className="tw-grid tw-gap-6">
                {!profile && (
                    <div className="tw-bg-amber-50 tw-border tw-border-amber-300 tw-rounded tw-p-4 tw-text-amber-900">
                        <i className="fas fa-info-circle tw-mr-2" aria-hidden />
                        Your applicant profile is incomplete. Contact your consultant to complete the intake.
                    </div>
                )}

                {report && (
                    <>
                        <Card title="Overall result">
                            <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
                                <StatusPill tone={OVERALL_TONE[report.overall]}>
                                    {report.overall === "pass"
                                        ? "All checks pass"
                                        : report.overall === "fail"
                                          ? "One or more requirements not met"
                                          : "Some information still needed"}
                                </StatusPill>
                                {report.meetsPoolMinimum !== null && (
                                    <StatusPill tone={report.meetsPoolMinimum ? "success" : "warning"}>
                                        {report.meetsPoolMinimum ? "Score above pool minimum" : "May not meet pool minimum score"}
                                    </StatusPill>
                                )}
                            </div>
                            <p className="tw-text-md tw-mt-3 tw-mb-0 tw-text-body">
                                This is a preliminary assessment only. It does not guarantee eligibility or nomination.
                                Your consultant will review and provide advice.
                            </p>
                        </Card>

                        <Card title="Eligibility checks">
                            <div className="tw-divide-y tw-divide-gray-200">
                                {report.results.map((check) => (
                                    <div key={check.key} className="tw-py-4 tw-flex tw-justify-between tw-items-start tw-gap-4">
                                        <div className="tw-flex-1 tw-min-w-0">
                                            <p className="tw-font-medium tw-text-heading tw-mb-1">{check.label}</p>
                                            {check.value && (
                                                <p className="tw-text-md tw-mb-1">
                                                    <span className="tw-text-body">Your value: </span>
                                                    {check.value}
                                                    <span className="tw-text-body tw-ml-2">
                                                        (required: {check.threshold})
                                                    </span>
                                                </p>
                                            )}
                                            {check.reason && (
                                                <p className="tw-text-md tw-text-body tw-mb-0">{check.reason}</p>
                                            )}
                                            {check.fix && check.status !== "pass" && (
                                                <p className="tw-text-md tw-text-amber-700 tw-mt-1 tw-mb-0">
                                                    <i className="fas fa-lightbulb tw-mr-1" aria-hidden />
                                                    {check.fix}
                                                </p>
                                            )}
                                        </div>
                                        <StatusPill tone={STATUS_TONE[check.status]}>
                                            {STATUS_LABEL[check.status]}
                                        </StatusPill>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                )}

                <div>
                    <Link href={`/app/bcpnp/${c.id}`} className="tw-text-primary hover:tw-underline tw-text-md">
                        ← Back to case
                    </Link>
                </div>
            </div>
        </>
    );
}
