import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { Table, Th, Td, EmptyRow } from "@dashboard-ui/table";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { listBcpnpCases } from "@dashboard/bcpnp/access";
import { fmtDate } from "@dashboard/format";
import type { BcpnpCaseStage } from "@dashboard/db/bcpnp-schema";
import type { PillTone } from "@dashboard-ui/status-pill";

export const metadata: Metadata = { title: "BC PNP Pipeline" };
export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<BcpnpCaseStage, string> = {
    intake_eligibility: "1. Intake & Eligibility",
    business_concept: "2. Business Concept",
    exploratory_visit: "3. Exploratory Visit",
    registration: "4. Registration",
    qualified_pool: "5. Qualified Pool",
    application: "6. Application",
    interview_performance: "7. Interview",
    work_permit_arrival: "8. Work Permit",
    business_establishment: "9. Establishment",
    final_report_nomination: "10. Final Report",
};

const STAGE_TONE: Record<BcpnpCaseStage, PillTone> = {
    intake_eligibility: "neutral",
    business_concept: "neutral",
    exploratory_visit: "primary",
    registration: "primary",
    qualified_pool: "primary",
    application: "warning",
    interview_performance: "warning",
    work_permit_arrival: "success",
    business_establishment: "success",
    final_report_nomination: "success",
};

export default async function BcpnpPipeline() {
    const user = await requireUser({ area: "superuser" });
    if (user.role !== "superuser" && user.role !== "admin") redirect("/app");
    await requireBcpnp("/app/superuser");

    const cases = await listBcpnpCases(user);

    // Group by stage for counts
    const stageCounts: Partial<Record<BcpnpCaseStage, number>> = {};
    for (const c of cases) {
        if (c.stage) stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1;
    }

    return (
        <>
            <PageHeader
                title="BC PNP Pipeline"
                description="All active cases by stage."
                actions={
                    <Link
                        href="/app/superuser/bcpnp/new"
                        className="tw-inline-flex tw-items-center tw-gap-2 tw-bg-primary tw-text-white tw-rounded tw-px-4 tw-py-2 tw-text-md tw-font-medium hover:tw-bg-primary/90"
                    >
                        <i className="fas fa-plus" aria-hidden />
                        New case
                    </Link>
                }
            />

            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-3 tw-mb-6">
                {(Object.entries(STAGE_LABELS) as [BcpnpCaseStage, string][]).map(([key, label]) => (
                    <div
                        key={key}
                        className="tw-bg-white tw-border tw-border-gray-500 tw-rounded tw-p-3 tw-text-center"
                    >
                        <p className="tw-text-h4 tw-font-bold tw-mb-0 tw-text-heading">
                            {stageCounts[key] ?? 0}
                        </p>
                        <p className="tw-text-sm tw-mb-0">{label}</p>
                    </div>
                ))}
            </div>

            <Card>
                <Table caption="BC PNP cases">
                    <thead>
                        <tr>
                            <Th>Applicant</Th>
                            <Th>Stream</Th>
                            <Th>Stage</Th>
                            <Th>Opened</Th>
                            <Th className="tw-w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {cases.length === 0 ? (
                            <EmptyRow colSpan={5}>No BC PNP cases yet. Create the first one.</EmptyRow>
                        ) : (
                            cases.map((c) => (
                                <tr key={c.id}>
                                    <Td>
                                        <span className="tw-font-medium tw-text-heading">
                                            {c.applicantName ?? "—"}
                                        </span>
                                        <span className="tw-block tw-text-sm tw-text-body">
                                            {c.applicantEmail}
                                        </span>
                                    </Td>
                                    <Td>
                                        {c.stream ? (
                                            <span className="tw-capitalize">{c.stream}</span>
                                        ) : (
                                            <span className="tw-text-gray-300">Not set</span>
                                        )}
                                    </Td>
                                    <Td>
                                        {c.stage ? (
                                            <StatusPill tone={STAGE_TONE[c.stage]}>
                                                {STAGE_LABELS[c.stage]}
                                            </StatusPill>
                                        ) : null}
                                    </Td>
                                    <Td>{fmtDate(c.openedAt)}</Td>
                                    <Td>
                                        <Link
                                            href={`/app/superuser/bcpnp/${c.id}`}
                                            className="tw-text-primary hover:tw-underline tw-text-md"
                                        >
                                            Open
                                        </Link>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>
        </>
    );
}
