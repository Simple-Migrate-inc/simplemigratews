import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import InfoNotice from "@dashboard-ui/info-notice";
import { Table, Th, Td, EmptyRow } from "@dashboard-ui/table";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { openBcpnpCase } from "@dashboard/bcpnp/access";
import { db, bcpnpSchema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";
import type { BcpnpDeadlineStatus } from "@dashboard/db/bcpnp-schema";
import type { PillTone } from "@dashboard-ui/status-pill";

export const metadata: Metadata = { title: "Deadlines" };
export const dynamic = "force-dynamic";

const DEADLINE_TONE: Record<BcpnpDeadlineStatus, PillTone> = {
    pending: "neutral",
    due_soon: "warning",
    overdue: "danger",
    completed: "success",
    waived: "secondary",
};

const DEADLINE_LABEL: Record<BcpnpDeadlineStatus, string> = {
    pending: "Upcoming",
    due_soon: "Due soon",
    overdue: "Overdue",
    completed: "Completed",
    waived: "Waived",
};

export default async function DeadlinesPage({
    params,
}: {
    params: { caseId: string };
}) {
    const user = await requireUser({ area: "candidate" });
    await requireBcpnp("/app");

    const opened = await openBcpnpCase(user, params.caseId);
    if (!opened) notFound();

    const c = opened.case;

    const deadlines = await db()
        .select()
        .from(bcpnpSchema.bcpnpDeadline)
        .where(eq(bcpnpSchema.bcpnpDeadline.caseId, c.id))
        .orderBy(bcpnpSchema.bcpnpDeadline.dueAt);

    // Group by status for summary counts
    const counts: Partial<Record<BcpnpDeadlineStatus, number>> = {};
    for (const d of deadlines) {
        counts[d.status] = (counts[d.status] ?? 0) + 1;
    }

    const urgent = deadlines.filter(
        (d) => d.status === "overdue" || d.status === "due_soon"
    );

    return (
        <>
            <PageHeader
                title="Deadlines"
                description="All program deadlines for your BC PNP case."
            />

            <InfoNotice />

            <div className="tw-grid tw-gap-6">
                {/* Summary row */}
                <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-5 tw-gap-3">
                    {(["overdue", "due_soon", "pending", "completed", "waived"] as BcpnpDeadlineStatus[]).map(
                        (status) => (
                            <div
                                key={status}
                                className={`tw-rounded tw-border tw-p-3 tw-text-center ${
                                    status === "overdue" && (counts[status] ?? 0) > 0
                                        ? "tw-border-red-400 tw-bg-red-50"
                                        : status === "due_soon" && (counts[status] ?? 0) > 0
                                          ? "tw-border-amber-400 tw-bg-amber-50"
                                          : "tw-border-gray-500 tw-bg-white"
                                }`}
                            >
                                <p className="tw-text-h4 tw-font-bold tw-mb-0 tw-text-heading">
                                    {counts[status] ?? 0}
                                </p>
                                <p className="tw-text-sm tw-mb-0 tw-capitalize">{DEADLINE_LABEL[status]}</p>
                            </div>
                        )
                    )}
                </div>

                {/* Urgent deadlines */}
                {urgent.length > 0 && (
                    <Card title="Action required">
                        <Table caption="Urgent deadlines">
                            <thead>
                                <tr>
                                    <Th>Deadline</Th>
                                    <Th>Due date</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {urgent.map((d) => (
                                    <tr key={d.id}>
                                        <Td>
                                            <span className="tw-font-medium tw-text-heading">{d.label}</span>
                                            {d.ruleKey && (
                                                <span className="tw-block tw-font-mono tw-text-sm tw-text-body">
                                                    {d.ruleKey}
                                                </span>
                                            )}
                                        </Td>
                                        <Td>{fmtDate(d.dueAt)}</Td>
                                        <Td>
                                            <StatusPill tone={DEADLINE_TONE[d.status]}>
                                                {DEADLINE_LABEL[d.status]}
                                            </StatusPill>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                )}

                {/* All deadlines */}
                <Card title="All deadlines">
                    <Table caption="All case deadlines">
                        <thead>
                            <tr>
                                <Th>Deadline</Th>
                                <Th>Due date</Th>
                                <Th>Completed</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {deadlines.length === 0 ? (
                                <EmptyRow colSpan={4}>
                                    No deadlines yet. Deadlines are created automatically when key events are recorded by your consultant.
                                </EmptyRow>
                            ) : (
                                deadlines.map((d) => (
                                    <tr key={d.id}>
                                        <Td>
                                            <span className="tw-font-medium tw-text-heading">{d.label}</span>
                                        </Td>
                                        <Td>{fmtDate(d.dueAt)}</Td>
                                        <Td>{d.completedAt ? fmtDate(d.completedAt) : "—"}</Td>
                                        <Td>
                                            <StatusPill tone={DEADLINE_TONE[d.status]}>
                                                {DEADLINE_LABEL[d.status]}
                                            </StatusPill>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
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
