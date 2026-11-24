import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { audit } from "@dashboard/audit";
import { requireUser } from "@dashboard/auth/session";
import { db, gpSchema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";
import { buildGpActor, canPartner } from "../../../../../../../lib/partners/permissions";
import {
    screenApplicationAction,
    scheduleApplicationAction,
    kycApplicationAction,
    approveApplicationAction,
    waitlistApplicationAction,
    declineApplicationAction,
} from "./actions";

export const dynamic = "force-dynamic";

function Def({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="tw-text-xs tw-text-body">{label}</dt>
            <dd className="tw-font-medium tw-text-heading">{children}</dd>
        </div>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const [app] = await db()
        .select({ company: gpSchema.gpApplication.company })
        .from(gpSchema.gpApplication)
        .where(eq(gpSchema.gpApplication.id, id))
        .limit(1);
    return { title: app ? `Application — ${app.company}` : "Application" };
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await requireUser({ area: "admin" });
    const actor = buildGpActor({ userId: user.id, role: user.role });

    const [app] = await db()
        .select()
        .from(gpSchema.gpApplication)
        .where(eq(gpSchema.gpApplication.id, id))
        .limit(1);

    if (!app) notFound();

    await audit({
        actorId:    user.id,
        action:     "admin.partner_application.view",
        objectType: "gp_application",
        objectId:   id,
    });

    const canScreen   = canPartner(actor, "application.screen");
    const canSchedule = canPartner(actor, "application.schedule");
    const canKyc      = canPartner(actor, "application.kyc");
    const canApprove  = canPartner(actor, "application.approve");
    const canWaitlist = canPartner(actor, "application.waitlist");
    const canDecline  = canPartner(actor, "application.decline");

    const isFinal = app.status === "approved" || app.status === "declined";

    return (
        <>
            <div className="tw-mb-4">
                <Link
                    href="/app/admin/partners/applications"
                    className="tw-text-sm tw-text-primary hover:tw-text-secondary"
                >
                    &larr; All applications
                </Link>
            </div>

            <PageHeader
                title={app.company}
                description={`${app.type.replace("_", " ")} · ${app.city}, ${app.country}`}
            />

            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
                {/* ── Main details ── */}
                <div className="lg:tw-col-span-2 tw-space-y-6">
                    <Card title="Contact">
                        <dl className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                            <Def label="Name">{app.contactName}</Def>
                            <Def label="Email">
                                <a href={`mailto:${app.email}`} className="tw-text-primary hover:tw-underline">
                                    {app.email}
                                </a>
                            </Def>
                            <Def label="Phone">{app.phone}</Def>
                            {app.website && (
                                <Def label="Website">
                                    <a
                                        href={app.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tw-text-primary hover:tw-underline"
                                    >
                                        {app.website}
                                    </a>
                                </Def>
                            )}
                        </dl>
                    </Card>

                    <Card title="Network">
                        <dl className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                            <Def label="Partner type">
                                <span className="tw-capitalize">{app.type.replace("_", " ")}</span>
                            </Def>
                            <Def label="Est. referrals / qtr">{String(app.estReferralsPerQtr)}</Def>
                            <Def label="Segments">
                                {app.segments && app.segments.length > 0
                                    ? app.segments.join(", ")
                                    : "—"}
                            </Def>
                            {app.licenceNo && <Def label="Licence no.">{app.licenceNo}</Def>}
                            {app.heardFrom && <Def label="Heard from">{app.heardFrom}</Def>}
                        </dl>
                    </Card>

                    {app.utm != null && Object.keys(app.utm as Record<string, unknown>).length > 0 && (
                        <Card title="UTM attribution">
                            <pre className="tw-text-xs tw-text-body tw-overflow-auto">
                                {JSON.stringify(app.utm as Record<string, unknown>, null, 2)}
                            </pre>
                        </Card>
                    )}
                </div>

                {/* ── Sidebar ── */}
                <div className="tw-space-y-6">
                    <Card title="Status">
                        <div className="tw-mb-4">
                            <StatusPill tone={
                                app.status === "approved"  ? "success" :
                                app.status === "declined"  ? "danger"  :
                                app.status === "waitlisted" ? "neutral" : "primary"
                            }>
                                {app.status.replace(/_/g, " ")}
                            </StatusPill>
                        </div>
                        <dl className="tw-text-sm tw-space-y-2">
                            <div>
                                <dt className="tw-text-body tw-text-xs">Auto-score</dt>
                                <dd className="tw-font-semibold tw-text-heading tw-tabular-nums">
                                    {app.autoScore} / 100
                                </dd>
                            </div>
                            <div>
                                <dt className="tw-text-body tw-text-xs">Received</dt>
                                <dd>{fmtDate(app.createdAt)}</dd>
                            </div>
                            {app.meetingAt && (
                                <div>
                                    <dt className="tw-text-body tw-text-xs">Meeting at</dt>
                                    <dd>{fmtDate(app.meetingAt)}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="tw-text-body tw-text-xs">CASL consent</dt>
                                <dd>{app.caslMarketingConsent ? "Yes" : "No"}</dd>
                            </div>
                        </dl>
                    </Card>

                    {!isFinal && (
                        <Card title="Actions">
                            <div className="tw-space-y-3">
                                {canScreen && app.status === "applied" && (
                                    <form action={screenApplicationAction}>
                                        <input type="hidden" name="appId" value={app.id} />
                                        <button
                                            type="submit"
                                            className="tw-w-full tw-bg-primary tw-text-white tw-text-sm tw-font-medium tw-py-2 tw-rounded hover:tw-bg-secondary tw-transition-colors"
                                        >
                                            Move to Screening
                                        </button>
                                    </form>
                                )}

                                {canSchedule && (app.status === "screening" || app.status === "applied") && (
                                    <form action={scheduleApplicationAction} className="tw-space-y-2">
                                        <input type="hidden" name="appId" value={app.id} />
                                        <label className="tw-block tw-text-xs tw-text-body tw-mb-1">
                                            Meeting date/time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="meetingAt"
                                            className="tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-2 tw-py-1 tw-text-sm"
                                        />
                                        <button
                                            type="submit"
                                            className="tw-w-full tw-border tw-border-primary tw-text-primary tw-text-sm tw-font-medium tw-py-2 tw-rounded hover:tw-bg-primary/10 tw-transition-colors"
                                        >
                                            Schedule Meeting
                                        </button>
                                    </form>
                                )}

                                {canKyc && app.status === "meeting_scheduled" && (
                                    <form action={kycApplicationAction}>
                                        <input type="hidden" name="appId" value={app.id} />
                                        <button
                                            type="submit"
                                            className="tw-w-full tw-border tw-border-primary tw-text-primary tw-text-sm tw-font-medium tw-py-2 tw-rounded hover:tw-bg-primary/10 tw-transition-colors"
                                        >
                                            Move to Due Diligence
                                        </button>
                                    </form>
                                )}

                                {canApprove && app.status === "due_diligence" && (
                                    <form action={approveApplicationAction}>
                                        <input type="hidden" name="appId" value={app.id} />
                                        <button
                                            type="submit"
                                            className="tw-w-full tw-bg-success tw-text-white tw-text-sm tw-font-medium tw-py-2 tw-rounded hover:tw-opacity-90 tw-transition-opacity"
                                        >
                                            Approve &amp; create org
                                        </button>
                                    </form>
                                )}

                                {canWaitlist && !["waitlisted", "approved", "declined"].includes(app.status) && (
                                    <form action={waitlistApplicationAction}>
                                        <input type="hidden" name="appId" value={app.id} />
                                        <button
                                            type="submit"
                                            className="tw-w-full tw-border tw-border-gray-500 tw-text-body tw-text-sm tw-font-medium tw-py-2 tw-rounded hover:tw-bg-light-100 tw-transition-colors"
                                        >
                                            Waitlist
                                        </button>
                                    </form>
                                )}

                                {canDecline && !["declined", "approved"].includes(app.status) && (
                                    <form action={declineApplicationAction} className="tw-space-y-2">
                                        <input type="hidden" name="appId" value={app.id} />
                                        <select
                                            name="reasonCode"
                                            className="tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-2 tw-py-1 tw-text-sm"
                                        >
                                            <option value="not_a_fit">Not a fit</option>
                                            <option value="ineligible_rcic">Ineligible (licensed immigration)</option>
                                            <option value="duplicate">Duplicate application</option>
                                            <option value="kyc_failed">KYC failed</option>
                                            <option value="no_response">No response</option>
                                        </select>
                                        <button
                                            type="submit"
                                            className="tw-w-full tw-border tw-border-danger tw-text-danger tw-text-sm tw-font-medium tw-py-2 tw-rounded hover:tw-bg-danger/10 tw-transition-colors"
                                        >
                                            Decline
                                        </button>
                                    </form>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
