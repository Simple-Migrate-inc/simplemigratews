import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { ROLE_LABEL, requiresMfa } from "@dashboard/auth/roles";
import { requireUser } from "@dashboard/auth/session";
import { db, schema } from "@dashboard/db";
import { fmtDateTime } from "@dashboard/format";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
    const user = await requireUser();
    const consents = await db()
        .select()
        .from(schema.consentRecord)
        .where(eq(schema.consentRecord.userId, user.id))
        .orderBy(desc(schema.consentRecord.acceptedAt));

    return (
        <>
            <PageHeader title="Account" />
            <div className="tw-grid tw-gap-6">
                <Card title="Profile">
                    <dl className="tw-text-md tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-6 tw-gap-y-2">
                        <dt>Name</dt>
                        <dd className="tw-text-heading">{user.name}</dd>
                        <dt>Email</dt>
                        <dd className="tw-text-heading tw-break-all">{user.email}</dd>
                        <dt>Role</dt>
                        <dd className="tw-text-heading">{ROLE_LABEL[user.role]}</dd>
                    </dl>
                </Card>
                <Card title="Two-step verification">
                    {user.twoFactorEnabled ? (
                        <p className="tw-mb-0">
                            <StatusPill tone="success">On</StatusPill>{" "}
                            <span className="tw-text-md">Your account is protected with an authenticator app.</span>
                        </p>
                    ) : (
                        <p className="tw-mb-0 tw-text-md">
                            {requiresMfa(user.role) ? "Required for your role. " : "Not turned on. "}
                            <Link href="/app/setup-mfa" className="tw-text-primary tw-font-medium">
                                Set up an authenticator app
                            </Link>
                        </p>
                    )}
                </Card>
                <Card title="What you agreed to">
                    <ul className="tw-divide-y tw-divide-gray-500">
                        {consents.map((c) => (
                            <li key={c.id} className="tw-py-3 tw-text-md">
                                <p className="tw-mb-1 tw-text-heading">{c.wording}</p>
                                <p className="tw-text-sm tw-mb-0">
                                    Accepted {fmtDateTime(c.acceptedAt)} · version {c.version}
                                </p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </>
    );
}
