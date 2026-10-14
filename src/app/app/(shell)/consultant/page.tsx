import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { EmptyRow, Table, Td, Th } from "@dashboard-ui/table";
import { audit } from "@dashboard/audit";
import { requireUser } from "@dashboard/auth/session";
import { stageLabel } from "@dashboard/cases";
import { db, schema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";

export const metadata: Metadata = { title: "Caseload" };
export const dynamic = "force-dynamic";

export default async function ConsultantHome() {
    const user = await requireUser({ area: "consultant" });
    const candidate = alias(schema.user, "candidate");

    const cases = await db()
        .select({
            id: schema.dashCase.id,
            stage: schema.dashCase.stage,
            openedAt: schema.dashCase.openedAt,
            candidateName: candidate.name,
            cohort: schema.cohort.name,
        })
        .from(schema.dashCase)
        .innerJoin(candidate, eq(candidate.id, schema.dashCase.candidateId))
        .leftJoin(schema.cohort, eq(schema.cohort.id, schema.dashCase.cohortId))
        .where(eq(schema.dashCase.consultantId, user.id))
        .orderBy(desc(schema.dashCase.openedAt));

    await audit({ actorId: user.id, action: "caseload.view", objectType: "case_list", meta: { count: cases.length } });

    return (
        <>
            <PageHeader title="Caseload" description="Files assigned to you." />
            {!user.licenceVerifiedAt && (
                <p className="tw-bg-warning/15 tw-text-heading tw-rounded tw-px-4 tw-py-3 tw-text-md tw-mb-6">
                    Your licence hasn't been verified yet. You can review files, but you can't release a readiness
                    summary until an admin records your licence verification.
                </p>
            )}
            <Card>
                <Table caption="Assigned cases">
                    <thead>
                        <tr>
                            <Th>Candidate</Th>
                            <Th>Stage</Th>
                            <Th>Cohort</Th>
                            <Th>Opened</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.length === 0 && <EmptyRow colSpan={4}>No files are assigned to you yet.</EmptyRow>}
                        {cases.map((c) => (
                            <tr key={c.id}>
                                <Td className="tw-font-medium tw-text-heading">{c.candidateName}</Td>
                                <Td>
                                    <StatusPill tone="primary">{stageLabel(c.stage)}</StatusPill>
                                </Td>
                                <Td>{c.cohort ?? "—"}</Td>
                                <Td>{fmtDate(c.openedAt)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </>
    );
}
