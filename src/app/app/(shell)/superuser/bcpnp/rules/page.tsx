import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import { Table, Th, Td, EmptyRow } from "@dashboard-ui/table";
import StatusPill from "@dashboard-ui/status-pill";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { db, bcpnpSchema } from "@dashboard/db";

export const metadata: Metadata = { title: "BC PNP Rule Library" };
export const dynamic = "force-dynamic";

export default async function RulesPage() {
    const user = await requireUser({ area: "superuser" });
    if (user.role !== "superuser" && user.role !== "admin") redirect("/app");
    await requireBcpnp("/app/superuser");

    const editions = await db()
        .select()
        .from(bcpnpSchema.bcpnpGuideEdition)
        .orderBy(asc(bcpnpSchema.bcpnpGuideEdition.effectiveFrom));

    const rules = await db()
        .select({
            id: bcpnpSchema.bcpnpRule.id,
            stream: bcpnpSchema.bcpnpRule.stream,
            key: bcpnpSchema.bcpnpRule.key,
            description: bcpnpSchema.bcpnpRule.description,
            valueNum: bcpnpSchema.bcpnpRule.valueNum,
            valueText: bcpnpSchema.bcpnpRule.valueText,
            valueJson: bcpnpSchema.bcpnpRule.valueJson,
            unit: bcpnpSchema.bcpnpRule.unit,
            sourceRef: bcpnpSchema.bcpnpRule.sourceRef,
            verified: bcpnpSchema.bcpnpRule.verified,
            editionCode: bcpnpSchema.bcpnpGuideEdition.code,
        })
        .from(bcpnpSchema.bcpnpRule)
        .innerJoin(
            bcpnpSchema.bcpnpGuideEdition,
            eq(bcpnpSchema.bcpnpRule.editionId, bcpnpSchema.bcpnpGuideEdition.id)
        )
        .orderBy(
            asc(bcpnpSchema.bcpnpGuideEdition.effectiveFrom),
            asc(bcpnpSchema.bcpnpRule.stream),
            asc(bcpnpSchema.bcpnpRule.key)
        );

    return (
        <>
            <PageHeader
                title="Rule Library"
                description={`${rules.length} rules across ${editions.length} guide editions.`}
            />

            <div className="tw-grid tw-gap-3 tw-mb-6">
                {editions.map((edition) => {
                    const editionRules = rules.filter((r) => r.editionCode === edition.code);
                    const verifiedCount = editionRules.filter((r) => r.verified).length;
                    return (
                        <div key={edition.id} className="tw-bg-white tw-border tw-border-gray-500 tw-rounded tw-p-4">
                            <div className="tw-flex tw-justify-between tw-items-center">
                                <div>
                                    <span className="tw-font-medium tw-text-heading">{edition.label}</span>
                                    <span className="tw-ml-3 tw-text-sm tw-text-body">
                                        Effective {String(edition.effectiveFrom)}
                                    </span>
                                </div>
                                <span className="tw-text-sm">
                                    {verifiedCount}/{editionRules.length} verified
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Card>
                <Table caption="All rules">
                    <thead>
                        <tr>
                            <Th>Edition</Th>
                            <Th>Stream</Th>
                            <Th>Key</Th>
                            <Th>Description</Th>
                            <Th>Value</Th>
                            <Th>Source</Th>
                            <Th>Status</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.length === 0 ? (
                            <EmptyRow colSpan={7}>No rules loaded yet. Run the seed script.</EmptyRow>
                        ) : (
                            rules.map((rule) => {
                                const displayValue =
                                    rule.valueNum !== null
                                        ? String(rule.valueNum)
                                        : rule.valueText !== null
                                          ? rule.valueText
                                          : rule.valueJson !== null
                                            ? JSON.stringify(rule.valueJson)
                                            : "—";
                                return (
                                    <tr key={rule.id}>
                                        <Td>
                                            <span className="tw-font-mono tw-text-sm">{rule.editionCode}</span>
                                        </Td>
                                        <Td>
                                            {rule.stream ? (
                                                <span className="tw-capitalize">{rule.stream}</span>
                                            ) : (
                                                <span className="tw-text-body tw-text-sm">Both</span>
                                            )}
                                        </Td>
                                        <Td>
                                            <span className="tw-font-mono tw-text-sm">{rule.key}</span>
                                        </Td>
                                        <Td>{rule.description}</Td>
                                        <Td>
                                            <span className="tw-font-mono tw-text-sm">{displayValue}</span>
                                            {rule.unit && (
                                                <span className="tw-text-sm tw-ml-1 tw-text-body">{rule.unit}</span>
                                            )}
                                        </Td>
                                        <Td>
                                            {rule.sourceRef ? (
                                                <span className="tw-text-sm">{rule.sourceRef}</span>
                                            ) : (
                                                "—"
                                            )}
                                        </Td>
                                        <Td>
                                            <StatusPill tone={rule.verified ? "success" : "warning"}>
                                                {rule.verified ? "Verified" : "Unverified"}
                                            </StatusPill>
                                        </Td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </Card>
        </>
    );
}
