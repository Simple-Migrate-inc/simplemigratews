import type { Metadata } from "next";
import { count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { EmptyRow, Table, Td, Th } from "@dashboard-ui/table";
import { audit } from "@dashboard/audit";
import { ROLE_LABEL, ROLES } from "@dashboard/auth/roles";
import { requireUser } from "@dashboard/auth/session";
import { stageLabel } from "@dashboard/cases";
import { db, schema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";
import { assignConsultantAction } from "./actions";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
    const admin = await requireUser({ area: "admin" });
    const candidate = alias(schema.user, "candidate");

    const [roleCounts, cases, consultants] = await Promise.all([
        db().select({ role: schema.user.role, n: count() }).from(schema.user).groupBy(schema.user.role),
        db()
            .select({
                id: schema.dashCase.id,
                stage: schema.dashCase.stage,
                openedAt: schema.dashCase.openedAt,
                consultantId: schema.dashCase.consultantId,
                candidateName: candidate.name,
                cohort: schema.cohort.name,
            })
            .from(schema.dashCase)
            .innerJoin(candidate, eq(candidate.id, schema.dashCase.candidateId))
            .leftJoin(schema.cohort, eq(schema.cohort.id, schema.dashCase.cohortId))
            .orderBy(desc(schema.dashCase.openedAt)),
        db()
            .select({ id: schema.user.id, name: schema.user.name })
            .from(schema.user)
            .where(eq(schema.user.role, "consultant")),
    ]);
    await audit({ actorId: admin.id, action: "admin.overview.view", objectType: "case_list", meta: { count: cases.length } });

    return (
        <>
            <PageHeader title="Admin overview" description="Pilot cohort at a glance." />
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-4 tw-mb-7.5">
                {ROLES.map((r) => (
                    <div key={r} className="tw-bg-white tw-border tw-border-gray-500 tw-rounded-lg tw-p-4">
                        <p className="tw-text-sm tw-mb-1">{ROLE_LABEL[r]}s</p>
                        <p className="tw-text-h3 tw-font-bold tw-text-heading tw-mb-0">
                            {roleCounts.find((c) => c.role === r)?.n ?? 0}
                        </p>
                    </div>
                ))}
            </div>
            <Card title="Cases">
                <Table caption="All cases">
                    <thead>
                        <tr>
                            <Th>Candidate</Th>
                            <Th>Stage</Th>
                            <Th>Cohort</Th>
                            <Th>Opened</Th>
                            <Th>Consultant</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.length === 0 && <EmptyRow colSpan={5}>No cases yet. Invite a candidate to open one.</EmptyRow>}
                        {cases.map((c) => (
                            <tr key={c.id}>
                                <Td className="tw-font-medium tw-text-heading">{c.candidateName}</Td>
                                <Td>
                                    <StatusPill tone="primary">{stageLabel(c.stage)}</StatusPill>
                                </Td>
                                <Td>{c.cohort ?? "—"}</Td>
                                <Td>{fmtDate(c.openedAt)}</Td>
                                <Td>
                                    <form action={assignConsultantAction} className="tw-flex tw-gap-2">
                                        <input type="hidden" name="caseId" value={c.id} />
                                        <label className="tw-sr-only" htmlFor={`consultant-${c.id}`}>
                                            Consultant for {c.candidateName}
                                        </label>
                                        <select
                                            id={`consultant-${c.id}`}
                                            name="consultantId"
                                            defaultValue={c.consultantId ?? ""}
                                            className="tw-border tw-border-gray-500 tw-rounded tw-px-2 tw-py-1.5 tw-text-md tw-bg-white"
                                        >
                                            <option value="">Unassigned</option>
                                            {consultants.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button type="submit" className="tw-text-md tw-font-medium tw-text-primary hover:tw-text-secondary">
                                            Save
                                        </button>
                                    </form>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </>
    );
}
