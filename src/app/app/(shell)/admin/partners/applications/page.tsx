import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { EmptyRow, Table, Td, Th } from "@dashboard-ui/table";
import { audit } from "@dashboard/audit";
import { requireUser } from "@dashboard/auth/session";
import { db, gpSchema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";

export const metadata: Metadata = { title: "Partner applications" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "primary" | "success" | "warning" | "danger" | "neutral"> = {
    applied:          "primary",
    screening:        "warning",
    meeting_scheduled: "warning",
    due_diligence:    "warning",
    approved:         "success",
    waitlisted:       "neutral",
    declined:         "danger",
};

export default async function PartnerApplicationsPage() {
    const actor = await requireUser({ area: "admin" });

    const applications = await db()
        .select()
        .from(gpSchema.gpApplication)
        .orderBy(desc(gpSchema.gpApplication.createdAt));

    await audit({
        actorId:    actor.id,
        action:     "admin.partner_applications.view",
        objectType: "gp_application_list",
        meta:       { count: applications.length },
    });

    return (
        <>
            <PageHeader
                title="Partner applications"
                description="Incoming applications from the public /partners/apply form."
            />
            <Card title={`Applications (${applications.length})`}>
                <Table caption="Partner applications">
                    <thead>
                        <tr>
                            <Th>Organisation</Th>
                            <Th>Type</Th>
                            <Th>Country</Th>
                            <Th>Score</Th>
                            <Th>Status</Th>
                            <Th>Received</Th>
                            <Th />
                        </tr>
                    </thead>
                    <tbody>
                        {applications.length === 0 && (
                            <EmptyRow colSpan={7}>
                                No applications yet. Share the /partners page to start receiving them.
                            </EmptyRow>
                        )}
                        {applications.map((app) => (
                            <tr key={app.id}>
                                <Td className="tw-font-medium tw-text-heading">
                                    {app.company}
                                    <span className="tw-block tw-text-xs tw-text-body tw-font-normal">
                                        {app.contactName} &middot; {app.email}
                                    </span>
                                </Td>
                                <Td className="tw-capitalize">
                                    {app.type.replace("_", " ")}
                                </Td>
                                <Td>{app.country}</Td>
                                <Td className="tw-tabular-nums">{app.autoScore}</Td>
                                <Td>
                                    <StatusPill tone={STATUS_TONE[app.status] ?? "muted"}>
                                        {app.status.replace(/_/g, " ")}
                                    </StatusPill>
                                </Td>
                                <Td>{fmtDate(app.createdAt)}</Td>
                                <Td>
                                    <Link
                                        href={`/app/admin/partners/applications/${app.id}`}
                                        className="tw-text-primary hover:tw-text-secondary tw-text-sm tw-font-medium"
                                    >
                                        Review
                                    </Link>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </>
    );
}
