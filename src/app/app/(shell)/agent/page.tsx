import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { audit } from "@dashboard/audit";
import { requireUser } from "@dashboard/auth/session";
import { db, schema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";

export const metadata: Metadata = { title: "Agent" };
export const dynamic = "force-dynamic";

export default async function AgentHome() {
    const user = await requireUser({ area: "agent" });
    const [profile] = await db()
        .select({ agent: schema.agent, brokerage: schema.brokerage })
        .from(schema.agent)
        .leftJoin(schema.brokerage, eq(schema.brokerage.id, schema.agent.brokerageId))
        .where(eq(schema.agent.userId, user.id))
        .limit(1);

    const [listings] = profile
        ? await db().select({ n: count() }).from(schema.propertyListing).where(eq(schema.propertyListing.listingAgentId, profile.agent.id))
        : [{ n: 0 }];
    await audit({ actorId: user.id, action: "agent.home.view", objectType: "agent", objectId: profile?.agent.id });

    const a = profile?.agent;
    return (
        <>
            <PageHeader title="Agent home" description="Your verified profile, listings and consented leads." />
            <div className="tw-grid md:tw-grid-cols-2 tw-gap-6">
                <Card title="Licence verification">
                    {!a ? (
                        <p className="tw-text-md tw-mb-0">
                            Your agent profile hasn't been created yet. Simple Migrate will ask for your licence number,
                            regulator and brokerage. Only verified agents can publish listings or receive leads.
                        </p>
                    ) : (
                        <dl className="tw-text-md tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-4 tw-gap-y-2">
                            <dt>Status</dt>
                            <dd>
                                <StatusPill tone={a.status === "verified" ? "success" : "warning"}>{a.status}</StatusPill>
                            </dd>
                            <dt>Regulator</dt>
                            <dd className="tw-text-heading">{a.regulator}</dd>
                            <dt>Licence</dt>
                            <dd className="tw-text-heading">{a.licenceNumber}</dd>
                            <dt>Brokerage</dt>
                            <dd className="tw-text-heading">{profile?.brokerage?.name ?? "—"}</dd>
                            <dt>Verified</dt>
                            <dd>{fmtDate(a.verifiedAt)}</dd>
                            <dt>Re-verify by</dt>
                            <dd>{fmtDate(a.reverifyDueAt)}</dd>
                        </dl>
                    )}
                </Card>
                <Card title="Listings">
                    <p className="tw-text-h3 tw-font-bold tw-text-heading tw-mb-1">{listings?.n ?? 0}</p>
                    <p className="tw-text-md tw-mb-0">Listing management and the leads inbox arrive in a later update.</p>
                </Card>
            </div>
        </>
    );
}
