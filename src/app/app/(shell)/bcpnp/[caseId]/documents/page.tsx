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
import type { BcpnpDocCategory } from "@dashboard/db/bcpnp-schema";
import type { PillTone } from "@dashboard-ui/status-pill";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<BcpnpDocCategory, string> = {
    identity: "Identity",
    financial: "Financial",
    business: "Business",
    immigration: "Immigration",
    legal: "Legal",
    other: "Other",
};

const SCAN_TONE: Record<string, PillTone> = {
    clean: "success",
    infected: "danger",
    pending: "neutral",
    failed: "warning",
};

export default async function DocumentsPage({
    params,
}: {
    params: { caseId: string };
}) {
    const user = await requireUser({ area: "candidate" });
    await requireBcpnp("/app");

    const opened = await openBcpnpCase(user, params.caseId);
    if (!opened) notFound();

    const c = opened.case;

    const documents = await db()
        .select()
        .from(bcpnpSchema.bcpnpDocument)
        .where(eq(bcpnpSchema.bcpnpDocument.caseId, c.id))
        .orderBy(bcpnpSchema.bcpnpDocument.category, bcpnpSchema.bcpnpDocument.createdAt);

    const active = documents.filter((d) => !d.deletedAt);

    // Group by category
    const grouped = new Map<BcpnpDocCategory, typeof active>();
    for (const doc of active) {
        const cat = doc.category;
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(doc);
    }

    const categories = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

    return (
        <>
            <PageHeader
                title="Documents"
                description={`${active.length} document${active.length !== 1 ? "s" : ""} uploaded.`}
            />

            <InfoNotice />

            <div className="tw-grid tw-gap-6">
                {active.length === 0 ? (
                    <Card>
                        <p className="tw-text-md tw-text-body">
                            No documents have been uploaded yet. Your consultant will upload required documents
                            and you will be notified here.
                        </p>
                    </Card>
                ) : (
                    categories.map(([category, docs]) => (
                        <Card key={category} title={CATEGORY_LABELS[category]}>
                            <Table caption={`${CATEGORY_LABELS[category]} documents`}>
                                <thead>
                                    <tr>
                                        <Th>Document</Th>
                                        <Th>Uploaded</Th>
                                        <Th>Expiry</Th>
                                        <Th>Status</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {docs.length === 0 ? (
                                        <EmptyRow colSpan={4}>No documents in this category.</EmptyRow>
                                    ) : (
                                        docs.map((doc) => (
                                            <tr key={doc.id}>
                                                <Td>
                                                    <span className="tw-font-medium tw-text-heading">{doc.label}</span>
                                                    {doc.filename && (
                                                        <span className="tw-block tw-text-sm tw-text-body tw-font-mono">{doc.filename}</span>
                                                    )}
                                                    {doc.notes && (
                                                        <span className="tw-block tw-text-sm tw-text-body">{doc.notes}</span>
                                                    )}
                                                </Td>
                                                <Td>{fmtDate(doc.createdAt)}</Td>
                                                <Td>
                                                    {doc.expiryDate ? fmtDate(new Date(doc.expiryDate)) : "—"}
                                                </Td>
                                                <Td>
                                                    {doc.acceptedAt ? (
                                                        <StatusPill tone="success">Accepted</StatusPill>
                                                    ) : (
                                                        <StatusPill tone={SCAN_TONE[doc.scanStatus] ?? "neutral"}>
                                                            {doc.scanStatus === "clean"
                                                                ? "Ready"
                                                                : doc.scanStatus === "infected"
                                                                  ? "Scan failed"
                                                                  : doc.scanStatus === "failed"
                                                                    ? "Upload failed"
                                                                    : "Processing"}
                                                        </StatusPill>
                                                    )}
                                                </Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </Card>
                    ))
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
