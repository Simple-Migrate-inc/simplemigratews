import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import InfoNotice from "@dashboard-ui/info-notice";
import { Table, Th, Td } from "@dashboard-ui/table";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { openBcpnpCase } from "@dashboard/bcpnp/access";
import { db, bcpnpSchema } from "@dashboard/db";
import { loadRules } from "@dashboard/bcpnp/rules";
import { summarizeInvestment, checkJobQualification } from "@dashboard/bcpnp/concept";
import type { InvestmentLineResult, JobPlanInput } from "@dashboard/bcpnp/concept";

export const metadata: Metadata = { title: "Business Concept" };
export const dynamic = "force-dynamic";

export default async function ConceptPage({
    params,
}: {
    params: { caseId: string };
}) {
    const user = await requireUser({ area: "candidate" });
    await requireBcpnp("/app");

    const opened = await openBcpnpCase(user, params.caseId);
    if (!opened) notFound();

    const c = opened.case;

    const concept = await db()
        .select()
        .from(bcpnpSchema.bcpnpBusinessConcept)
        .where(eq(bcpnpSchema.bcpnpBusinessConcept.caseId, c.id))
        .orderBy(desc(bcpnpSchema.bcpnpBusinessConcept.version))
        .limit(1)
        .then((r) => r[0] ?? null);

    if (!concept) {
        return (
            <>
                <PageHeader title="Business Concept" description="No business concept has been submitted yet." />
                <InfoNotice />
                <div>
                    <Link href={`/app/bcpnp/${c.id}`} className="tw-text-primary hover:tw-underline tw-text-md">
                        ← Back to case
                    </Link>
                </div>
            </>
        );
    }

    const [investmentLines, jobRows] = await Promise.all([
        db()
            .select()
            .from(bcpnpSchema.bcpnpInvestmentLine)
            .where(eq(bcpnpSchema.bcpnpInvestmentLine.conceptId, concept.id)),
        db()
            .select()
            .from(bcpnpSchema.bcpnpJobPlan)
            .where(eq(bcpnpSchema.bcpnpJobPlan.conceptId, concept.id)),
    ]);

    // Use the stored eligible values (computed server-side when lines were saved)
    const lineResults: InvestmentLineResult[] = investmentLines.map((l) => ({
        id: l.id,
        description: l.description,
        category: l.category,
        amountCadCents: l.amountCadCents,
        eligibleCadCents: l.eligibleCadCents,
        capAppliedCadCents: l.capAppliedCadCents ?? null,
        capReason: l.capReason ?? null,
        preIta: l.preIta,
        externalFinancing: l.externalFinancing,
    }));

    const jobInputs: JobPlanInput[] = jobRows.map((j) => ({
        id: j.id,
        jobTitle: j.jobTitle,
        hoursPerWeek: j.hoursPerWeek,
        annualHours: j.annualHours,
        isOnSite: j.isOnSite,
        isDirectEmployee: j.isDirectEmployee,
        shareholderPct: j.shareholderPct !== null ? Number(j.shareholderPct) : null,
    }));

    let investmentSummary: ReturnType<typeof summarizeInvestment> | null = null;
    let jobResults: ReturnType<typeof checkJobQualification> | null = null;

    if (c.stream && c.guideEditionId) {
        const rules = await loadRules(c.guideEditionId, c.stream);
        investmentSummary = summarizeInvestment(lineResults, c.stream, rules);
        if (jobInputs.length > 0) {
            jobResults = checkJobQualification(jobInputs, rules);
        }
    }

    const fmtCad = (cents: number) =>
        `CAD ${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;

    return (
        <>
            <PageHeader
                title="Business Concept"
                description={`Version ${concept.version}${concept.lockedAt ? " · Locked" : " · Draft"}`}
            />

            <InfoNotice />

            <div className="tw-grid tw-gap-6">
                {/* Business details */}
                <Card title="Business">
                    <dl className="tw-grid sm:tw-grid-cols-2 tw-gap-x-6 tw-gap-y-3 tw-text-md">
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Business name</dt>
                            <dd>{concept.businessName ?? "—"}</dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Type</dt>
                            <dd className="tw-capitalize">{concept.businessType ?? "—"}</dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">NAICS code</dt>
                            <dd>{concept.naicsCode ?? "—"}</dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Industry</dt>
                            <dd>{concept.naicsDescription ?? "—"}</dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Location</dt>
                            <dd>{concept.businessLocation ?? "—"}</dd>
                        </div>
                    </dl>

                    {concept.ineligibleFlag && (
                        <div className="tw-mt-4 tw-bg-red-50 tw-border tw-border-red-300 tw-rounded tw-p-3 tw-text-red-900">
                            <i className="fas fa-ban tw-mr-2" aria-hidden />
                            <strong>Ineligible business:</strong> {concept.ineligibleFlag}
                        </div>
                    )}
                    {concept.regulatedSectorFlag && !concept.ineligibleFlag && (
                        <div className="tw-mt-4 tw-bg-amber-50 tw-border tw-border-amber-300 tw-rounded tw-p-3 tw-text-amber-900">
                            <i className="fas fa-exclamation-triangle tw-mr-2" aria-hidden />
                            <strong>Regulated sector:</strong> {concept.regulatedSectorFlag}
                        </div>
                    )}
                </Card>

                {/* Investment plan */}
                <Card
                    title="Investment plan"
                    actions={
                        investmentSummary ? (
                            <StatusPill tone={investmentSummary.meetsMinimum ? "success" : "danger"}>
                                {investmentSummary.meetsMinimum ? "Meets minimum" : "Below minimum"}
                            </StatusPill>
                        ) : null
                    }
                >
                    {investmentLines.length === 0 ? (
                        <p className="tw-text-md tw-text-body">No investment lines submitted yet.</p>
                    ) : (
                        <>
                            <Table caption="Investment lines">
                                <thead>
                                    <tr>
                                        <Th>Description</Th>
                                        <Th>Category</Th>
                                        <Th>Amount</Th>
                                        <Th>Eligible</Th>
                                        <Th>Notes</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineResults.map((line) => (
                                        <tr key={line.id}>
                                            <Td>{line.description}</Td>
                                            <Td className="tw-capitalize">{line.category.replace(/_/g, " ")}</Td>
                                            <Td>{fmtCad(line.amountCadCents)}</Td>
                                            <Td>
                                                {line.preIta || line.externalFinancing
                                                    ? <span className="tw-text-body">$0</span>
                                                    : fmtCad(line.eligibleCadCents)}
                                            </Td>
                                            <Td>
                                                {line.preIta && (
                                                    <span className="tw-text-sm tw-text-body tw-block">Pre-ITA</span>
                                                )}
                                                {line.externalFinancing && (
                                                    <span className="tw-text-sm tw-text-body tw-block">External financing</span>
                                                )}
                                                {line.capReason && (
                                                    <span className="tw-text-sm tw-text-amber-700 tw-block">{line.capReason}</span>
                                                )}
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {investmentSummary && (
                                <dl className="tw-grid sm:tw-grid-cols-3 tw-gap-4 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200 tw-text-md">
                                    <div>
                                        <dt className="tw-text-body">Total investment</dt>
                                        <dd className="tw-font-medium tw-text-heading">{fmtCad(investmentSummary.totalAmountCadCents)}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-body">Eligible amount</dt>
                                        <dd className="tw-font-medium tw-text-heading">{fmtCad(investmentSummary.totalEligibleCadCents)}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-body">Minimum required</dt>
                                        <dd className="tw-font-medium tw-text-heading">{fmtCad(investmentSummary.minimumCadCents)}</dd>
                                    </div>
                                </dl>
                            )}
                        </>
                    )}
                </Card>

                {/* Job plan */}
                <Card title="Planned jobs">
                    {jobRows.length === 0 ? (
                        <p className="tw-text-md tw-text-body">No job plan submitted yet.</p>
                    ) : (
                        <Table caption="Job plan">
                            <thead>
                                <tr>
                                    <Th>Job title</Th>
                                    <Th>Hours/week</Th>
                                    <Th>Annual hours</Th>
                                    <Th>Start</Th>
                                    <Th>Qualification</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobRows.map((dbJob, i) => {
                                    const result = jobResults?.[i];
                                    return (
                                        <tr key={dbJob.id}>
                                            <Td>{dbJob.jobTitle}</Td>
                                            <Td>{dbJob.hoursPerWeek}</Td>
                                            <Td>{dbJob.annualHours.toLocaleString("en-CA")}</Td>
                                            <Td>
                                                {dbJob.startDate ? String(dbJob.startDate) : "—"}
                                            </Td>
                                            <Td>
                                                {result ? (
                                                    <StatusPill tone={result.qualifiesAsFte ? "success" : "danger"}>
                                                        {result.qualifiesAsFte
                                                            ? "Qualifies as FTE"
                                                            : result.disqualifyingReasons[0] ?? "Does not qualify"}
                                                    </StatusPill>
                                                ) : (
                                                    <span className="tw-text-body">—</span>
                                                )}
                                            </Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Card>

                <div>
                    <Link href={`/app/bcpnp/${c.id}`} className="tw-text-primary hover:tw-underline tw-text-md">
                        ← Back to case
                    </Link>
                </div>
            </div>
        </>
    );
}
