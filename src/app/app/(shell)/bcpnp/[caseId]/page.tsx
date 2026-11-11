import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import InfoNotice from "@dashboard-ui/info-notice";
import { Table, Th, Td } from "@dashboard-ui/table";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { openBcpnpCase } from "@dashboard/bcpnp/access";
import { db, bcpnpSchema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";
import type { BcpnpCaseStage, BcpnpDeadlineStatus } from "@dashboard/db/bcpnp-schema";
import type { PillTone } from "@dashboard-ui/status-pill";

export const metadata: Metadata = { title: "My BC PNP Case" };
export const dynamic = "force-dynamic";

const STAGES: BcpnpCaseStage[] = [
    "intake_eligibility", "business_concept", "exploratory_visit", "registration",
    "qualified_pool", "application", "interview_performance", "work_permit_arrival",
    "business_establishment", "final_report_nomination",
];

const STAGE_LABELS: Record<BcpnpCaseStage, string> = {
    intake_eligibility: "Intake & Eligibility",
    business_concept: "Business Concept",
    exploratory_visit: "Exploratory Visit",
    registration: "Registration",
    qualified_pool: "Qualified Pool",
    application: "Application",
    interview_performance: "Interview",
    work_permit_arrival: "Work Permit",
    business_establishment: "Establishment",
    final_report_nomination: "Final Report",
};

const DEADLINE_TONE: Record<BcpnpDeadlineStatus, PillTone> = {
    pending: "neutral",
    due_soon: "warning",
    overdue: "danger",
    completed: "success",
    waived: "secondary",
};

export default async function ApplicantCaseHome({
    params,
}: {
    params: { caseId: string };
}) {
    const user = await requireUser({ area: "candidate" });
    await requireBcpnp("/app");

    const opened = await openBcpnpCase(user, params.caseId);
    if (!opened) notFound();

    const c = opened.case;
    const currentIdx = STAGES.indexOf(c.stage);

    const upcoming = await db()
        .select()
        .from(bcpnpSchema.bcpnpDeadline)
        .where(
            and(
                eq(bcpnpSchema.bcpnpDeadline.caseId, c.id),
                inArray(bcpnpSchema.bcpnpDeadline.status, ["overdue", "due_soon"])
            )
        )
        .orderBy(bcpnpSchema.bcpnpDeadline.dueAt)
        .limit(5);

    return (
        <>
            <PageHeader
                title="My BC PNP Case"
                description={`${c.stream ? c.stream.charAt(0).toUpperCase() + c.stream.slice(1) : "Stream not set"} stream · Stage ${currentIdx + 1} of ${STAGES.length}`}
            />

            <InfoNotice />

            <div className="tw-grid tw-gap-6">
                {/* Stage tracker */}
                <Card title="Your progress">
                    <ol className="tw-flex tw-flex-wrap tw-gap-2">
                        {STAGES.map((s, i) => (
                            <li
                                key={s}
                                className={`tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-rounded tw-px-3 tw-py-1.5 tw-border ${
                                    i < currentIdx
                                        ? "tw-border-primary/40 tw-bg-primary/5 tw-text-primary"
                                        : i === currentIdx
                                          ? "tw-border-primary tw-bg-primary tw-text-white tw-font-medium"
                                          : "tw-border-gray-500 tw-text-gray-300"
                                }`}
                            >
                                {i < currentIdx && <i className="fas fa-check tw-text-xs" aria-hidden />}
                                {i === currentIdx && <i className="fas fa-circle tw-text-xs" aria-hidden />}
                                {STAGE_LABELS[s]}
                            </li>
                        ))}
                    </ol>
                </Card>

                {/* Quick links */}
                <div className="tw-grid sm:tw-grid-cols-3 tw-gap-4">
                    {[
                        {
                            href: `/app/bcpnp/${c.id}/eligibility`,
                            icon: "fas fa-check-circle",
                            label: "Eligibility",
                            description: "Review your eligibility assessment",
                        },
                        {
                            href: `/app/bcpnp/${c.id}/concept`,
                            icon: "fas fa-building",
                            label: "Business Concept",
                            description: "Investment plan and job projections",
                        },
                        {
                            href: `/app/bcpnp/${c.id}/documents`,
                            icon: "fas fa-folder-open",
                            label: "Documents",
                            description: "Your uploaded documents",
                        },
                        {
                            href: `/app/bcpnp/${c.id}/deadlines`,
                            icon: "fas fa-calendar-alt",
                            label: "Deadlines",
                            description: "All program deadlines",
                        },
                    ].map(({ href, icon, label, description }) => (
                        <Link
                            key={href}
                            href={href}
                            className="tw-block tw-bg-white tw-border tw-border-gray-500 tw-rounded tw-p-4 hover:tw-border-primary hover:tw-shadow-sm tw-transition-shadow"
                        >
                            <i className={`${icon} tw-text-primary tw-text-h4 tw-mb-2`} aria-hidden />
                            <p className="tw-font-medium tw-text-heading tw-mb-1">{label}</p>
                            <p className="tw-text-sm tw-text-body tw-mb-0">{description}</p>
                        </Link>
                    ))}
                </div>

                {/* Upcoming deadlines */}
                {upcoming.length > 0 && (
                    <Card
                        title="Upcoming deadlines"
                        actions={
                            <Link href={`/app/bcpnp/${c.id}/deadlines`} className="tw-text-primary hover:tw-underline tw-text-md">
                                View all
                            </Link>
                        }
                    >
                        <Table caption="Upcoming deadlines">
                            <thead>
                                <tr>
                                    <Th>Deadline</Th>
                                    <Th>Due</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcoming.map((d) => (
                                    <tr key={d.id}>
                                        <Td>{d.label}</Td>
                                        <Td>{fmtDate(d.dueAt)}</Td>
                                        <Td>
                                            <StatusPill tone={DEADLINE_TONE[d.status]}>
                                                {d.status.replace(/_/g, " ")}
                                            </StatusPill>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                )}
            </div>
        </>
    );
}
