import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { Table, Th, Td, EmptyRow } from "@dashboard-ui/table";
import InfoNotice from "@dashboard-ui/info-notice";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { openBcpnpCase } from "@dashboard/bcpnp/access";
import { db, schema, bcpnpSchema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";
import { advanceBcpnpStage, recordBcpnpEvent } from "../actions";
import type { BcpnpCaseStage, BcpnpDeadlineStatus } from "@dashboard/db/bcpnp-schema";
import type { PillTone } from "@dashboard-ui/status-pill";

export const metadata: Metadata = { title: "BC PNP Case" };
export const dynamic = "force-dynamic";

const STAGES: BcpnpCaseStage[] = [
    "intake_eligibility", "business_concept", "exploratory_visit", "registration",
    "qualified_pool", "application", "interview_performance", "work_permit_arrival",
    "business_establishment", "final_report_nomination",
];

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

const DEADLINE_TONE: Record<BcpnpDeadlineStatus, PillTone> = {
    pending: "neutral",
    due_soon: "warning",
    overdue: "danger",
    completed: "success",
    waived: "secondary",
};

const ANCHOR_EVENTS = [
    "registration_submitted",
    "invitation_to_apply",
    "confirmation_letter_issued",
    "arrival",
    "work_permit_issued",
    "nomination_confirmed",
];

export default async function BcpnpCaseDetail({
    params,
}: {
    params: { caseId: string };
}) {
    const user = await requireUser({ area: "superuser" });
    if (user.role !== "superuser" && user.role !== "admin") redirect("/app");
    await requireBcpnp("/app/superuser");

    const opened = await openBcpnpCase(user, params.caseId);
    if (!opened) notFound();

    const c = opened.case;

    // Load related data in parallel
    const [applicant, deadlines, events, profile] = await Promise.all([
        db()
            .select({ name: schema.user.name, email: schema.user.email })
            .from(schema.user)
            .where(eq(schema.user.id, c.applicantId))
            .limit(1)
            .then((r) => r[0]),
        db()
            .select()
            .from(bcpnpSchema.bcpnpDeadline)
            .where(eq(bcpnpSchema.bcpnpDeadline.caseId, c.id))
            .orderBy(bcpnpSchema.bcpnpDeadline.dueAt),
        db()
            .select()
            .from(bcpnpSchema.bcpnpCaseEvent)
            .where(eq(bcpnpSchema.bcpnpCaseEvent.caseId, c.id)),
        db()
            .select()
            .from(bcpnpSchema.bcpnpApplicantProfile)
            .where(eq(bcpnpSchema.bcpnpApplicantProfile.caseId, c.id))
            .limit(1)
            .then((r) => r[0] ?? null),
    ]);

    const currentIdx = STAGES.indexOf(c.stage);
    const nextStage = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;

    return (
        <>
            <PageHeader
                title={applicant?.name ?? "BC PNP Case"}
                description={`${c.stream ? c.stream.charAt(0).toUpperCase() + c.stream.slice(1) : "Stream not set"} · ${STAGE_LABELS[c.stage]}`}
            />

            <InfoNotice />

            <div className="tw-grid tw-gap-6">
                {/* Stage management */}
                <Card
                    title="Stage"
                    actions={
                        nextStage ? (
                            <form action={advanceBcpnpStage}>
                                <input type="hidden" name="caseId" value={c.id} />
                                <input type="hidden" name="newStage" value={nextStage} />
                                <button
                                    type="submit"
                                    className="tw-text-sm tw-bg-primary tw-text-white tw-rounded tw-px-3 tw-py-1.5 tw-font-medium hover:tw-bg-primary/90"
                                >
                                    Advance → {STAGE_LABELS[nextStage]}
                                </button>
                            </form>
                        ) : null
                    }
                >
                    <ol className="tw-flex tw-flex-wrap tw-gap-2">
                        {STAGES.map((s, i) => (
                            <li
                                key={s}
                                className={`tw-text-sm tw-rounded tw-px-2 tw-py-1 tw-border ${
                                    i < currentIdx
                                        ? "tw-border-primary/30 tw-bg-primary/5 tw-text-primary"
                                        : i === currentIdx
                                          ? "tw-border-primary tw-bg-primary tw-text-white"
                                          : "tw-border-gray-500 tw-text-gray-300"
                                }`}
                            >
                                {STAGE_LABELS[s]}
                            </li>
                        ))}
                    </ol>
                </Card>

                {/* Applicant profile summary */}
                <Card title="Applicant">
                    <dl className="tw-grid sm:tw-grid-cols-2 tw-gap-x-6 tw-gap-y-3 tw-text-md">
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Name</dt>
                            <dd>{applicant?.name ?? "—"}</dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Email</dt>
                            <dd>{applicant?.email ?? "—"}</dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Net worth</dt>
                            <dd>
                                {profile?.netWorthCadCents
                                    ? `CAD ${(profile.netWorthCadCents / 100).toLocaleString("en-CA")}`
                                    : "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Investment</dt>
                            <dd>
                                {profile?.proposedInvestmentCadCents
                                    ? `CAD ${(profile.proposedInvestmentCadCents / 100).toLocaleString("en-CA")}`
                                    : "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Business type</dt>
                            <dd className="tw-capitalize">{profile?.businessType ?? "—"}</dd>
                        </div>
                        <div>
                            <dt className="tw-font-medium tw-text-heading">Language test</dt>
                            <dd className="tw-uppercase">{profile?.languageTestType ?? "—"}</dd>
                        </div>
                    </dl>
                    <div className="tw-mt-4">
                        <Link href={`/app/bcpnp/${c.id}/eligibility`} className="tw-text-primary hover:tw-underline tw-text-md tw-mr-4">
                            View eligibility
                        </Link>
                        <Link href={`/app/bcpnp/${c.id}/concept`} className="tw-text-primary hover:tw-underline tw-text-md">
                            View concept
                        </Link>
                    </div>
                </Card>

                {/* Record anchor event */}
                <Card title="Record anchor event">
                    <p className="tw-text-md tw-mb-4">
                        Recording an event creates the associated deadlines automatically.
                    </p>
                    <form action={recordBcpnpEvent} className="tw-flex tw-flex-wrap tw-gap-3 tw-items-end">
                        <input type="hidden" name="caseId" value={c.id} />
                        <div>
                            <label htmlFor="eventKey" className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                                Event
                            </label>
                            <select
                                id="eventKey"
                                name="eventKey"
                                required
                                className="tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
                            >
                                {ANCHOR_EVENTS.map((e) => (
                                    <option key={e} value={e}>
                                        {e.replace(/_/g, " ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="occurredAt" className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                                Date
                            </label>
                            <input
                                id="occurredAt"
                                name="occurredAt"
                                type="date"
                                required
                                className="tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
                            />
                        </div>
                        <button
                            type="submit"
                            className="tw-bg-primary tw-text-white tw-rounded tw-px-4 tw-py-2 tw-text-md tw-font-medium hover:tw-bg-primary/90"
                        >
                            Record
                        </button>
                    </form>

                    {events.length > 0 && (
                        <div className="tw-mt-5">
                            <h3 className="tw-text-md tw-font-medium tw-text-heading tw-mb-2">Recorded events</h3>
                            <ul className="tw-text-md tw-space-y-1">
                                {events.map((ev) => (
                                    <li key={ev.id}>
                                        <span className="tw-font-medium">{ev.eventKey.replace(/_/g, " ")}</span>
                                        {ev.occurredAt && (
                                            <span className="tw-text-body tw-ml-2">{fmtDate(ev.occurredAt)}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Card>

                {/* Deadlines */}
                <Card title="Deadlines">
                    <Table caption="Case deadlines">
                        <thead>
                            <tr>
                                <Th>Deadline</Th>
                                <Th>Due</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {deadlines.length === 0 ? (
                                <EmptyRow colSpan={3}>
                                    No deadlines yet. Record an anchor event above to generate them.
                                </EmptyRow>
                            ) : (
                                deadlines.map((d) => (
                                    <tr key={d.id}>
                                        <Td>{d.label}</Td>
                                        <Td>{fmtDate(d.dueAt)}</Td>
                                        <Td>
                                            <StatusPill tone={DEADLINE_TONE[d.status]}>
                                                {d.status.replace(/_/g, " ")}
                                            </StatusPill>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card>
            </div>
        </>
    );
}
