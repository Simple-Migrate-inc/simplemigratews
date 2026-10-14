import type { Metadata } from "next";
import { and, desc, eq, gt, inArray, isNotNull, isNull } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { EmptyRow, Table, Td, Th } from "@dashboard-ui/table";
import { audit } from "@dashboard/audit";
import { actorFor } from "@dashboard/auth/case-access";
import { requireUser } from "@dashboard/auth/session";
import { db, schema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";

export const metadata: Metadata = { title: "Referrals" };
export const dynamic = "force-dynamic";

export default async function PartnerHome() {
    const user = await requireUser({ area: "partner" });
    const actor = await actorFor(user);
    const partnerIds = actor.partnerIds ?? [];

    const firms = partnerIds.length
        ? await db().select().from(schema.partner).where(inArray(schema.partner.id, partnerIds))
        : [];

    // Only referrals backed by a candidate-approved, unexpired, unrevoked grant.
    const now = new Date();
    const referrals = partnerIds.length
        ? await db()
              .select({
                  id: schema.referral.id,
                  status: schema.referral.status,
                  createdAt: schema.referral.createdAt,
                  expiresAt: schema.consentGrant.expiresAt,
                  firm: schema.partner.firm,
              })
              .from(schema.referral)
              .innerJoin(schema.consentGrant, eq(schema.consentGrant.id, schema.referral.consentGrantId))
              .innerJoin(schema.partner, eq(schema.partner.id, schema.referral.partnerId))
              .where(
                  and(
                      inArray(schema.referral.partnerId, partnerIds),
                      eq(schema.consentGrant.status, "approved"),
                      isNotNull(schema.consentGrant.approvedAt),
                      isNull(schema.consentGrant.revokedAt),
                      gt(schema.consentGrant.expiresAt, now)
                  )
              )
              .orderBy(desc(schema.referral.createdAt))
        : [];
    await audit({ actorId: user.id, action: "partner.referrals.view", objectType: "referral_list", meta: { count: referrals.length } });

    return (
        <>
            <PageHeader
                title="Referrals"
                description={firms.length ? firms.map((f) => f.firm).join(", ") : "You're not linked to a partner firm yet."}
            />
            <Card>
                <p className="tw-text-md">
                    You only see files a candidate has approved for sharing with your firm, for the scope and period
                    they agreed to. Access ends immediately if they revoke it.
                </p>
                <Table caption="Referrals">
                    <thead>
                        <tr>
                            <Th>Referral</Th>
                            <Th>Status</Th>
                            <Th>Received</Th>
                            <Th>Access until</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {referrals.length === 0 && <EmptyRow colSpan={4}>No referrals shared with you yet.</EmptyRow>}
                        {referrals.map((r) => (
                            <tr key={r.id}>
                                <Td className="tw-font-medium tw-text-heading">Referral {r.id.slice(0, 8)}</Td>
                                <Td>
                                    <StatusPill tone="secondary">{r.status.replace("_", " ")}</StatusPill>
                                </Td>
                                <Td>{fmtDate(r.createdAt)}</Td>
                                <Td>{fmtDate(r.expiresAt)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </>
    );
}
