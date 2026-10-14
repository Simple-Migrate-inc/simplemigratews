import type { Metadata } from "next";
import { and, asc, desc, gt, isNull } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { EmptyRow, Table, Td, Th } from "@dashboard-ui/table";
import { audit } from "@dashboard/audit";
import { ROLE_LABEL, requiresMfa } from "@dashboard/auth/roles";
import { requireUser } from "@dashboard/auth/session";
import { db, schema } from "@dashboard/db";
import { fmtDate } from "@dashboard/format";
import { revokeInvitationAction, setUserStatusAction, verifyLicenceAction } from "../actions";
import InviteForm from "./invite-form";

export const metadata: Metadata = { title: "Users & invites" };
export const dynamic = "force-dynamic";

const smallInput = "tw-border tw-border-gray-500 tw-rounded tw-px-2 tw-py-1 tw-text-sm tw-w-28";

export default async function AdminUsers() {
    const admin = await requireUser({ area: "admin" });
    const [users, invites, cohorts, partners] = await Promise.all([
        db().select().from(schema.user).orderBy(asc(schema.user.role), asc(schema.user.name)),
        db()
            .select()
            .from(schema.invitation)
            .where(and(isNull(schema.invitation.usedAt), isNull(schema.invitation.revokedAt), gt(schema.invitation.expiresAt, new Date())))
            .orderBy(desc(schema.invitation.createdAt)),
        db().select({ id: schema.cohort.id, name: schema.cohort.name }).from(schema.cohort),
        db().select({ id: schema.partner.id, firm: schema.partner.firm }).from(schema.partner),
    ]);
    await audit({ actorId: admin.id, action: "admin.users.view", objectType: "user_list" });

    return (
        <>
            <PageHeader title="Users & invites" description="The pilot is invitation-only. Invitations work once and expire after 7 days." />
            <div className="tw-grid tw-gap-6">
                <Card title="Invite someone">
                    <InviteForm cohorts={cohorts} partners={partners} />
                </Card>

                <Card title="Open invitations">
                    <Table caption="Open invitations">
                        <thead>
                            <tr>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Expires</Th>
                                <Th />
                            </tr>
                        </thead>
                        <tbody>
                            {invites.length === 0 && <EmptyRow colSpan={4}>No open invitations.</EmptyRow>}
                            {invites.map((i) => (
                                <tr key={i.id}>
                                    <Td>{i.email}</Td>
                                    <Td>{ROLE_LABEL[i.role]}</Td>
                                    <Td>{fmtDate(i.expiresAt)}</Td>
                                    <Td className="tw-text-right">
                                        <form action={revokeInvitationAction}>
                                            <input type="hidden" name="id" value={i.id} />
                                            <button type="submit" className="tw-text-md tw-text-danger hover:tw-underline">
                                                Revoke
                                            </button>
                                        </form>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>

                <Card title="Users">
                    <Table caption="Users">
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Role</Th>
                                <Th>Two-step</Th>
                                <Th>Licence</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <Td>
                                        <span className="tw-font-medium tw-text-heading tw-block">{u.name}</span>
                                        <span className="tw-text-sm">{u.email}</span>
                                    </Td>
                                    <Td>{ROLE_LABEL[u.role]}</Td>
                                    <Td>
                                        {u.twoFactorEnabled ? (
                                            <StatusPill tone="success">On</StatusPill>
                                        ) : (
                                            <StatusPill tone={requiresMfa(u.role) ? "warning" : "neutral"}>
                                                {requiresMfa(u.role) ? "Required — not set up" : "Off"}
                                            </StatusPill>
                                        )}
                                    </Td>
                                    <Td>
                                        {u.role !== "consultant" ? (
                                            "—"
                                        ) : u.licenceVerifiedAt ? (
                                            <span className="tw-text-sm">
                                                {u.licenceBody} {u.licenceNumber}
                                                <span className="tw-block">Verified {fmtDate(u.licenceVerifiedAt)}</span>
                                            </span>
                                        ) : (
                                            <form action={verifyLicenceAction} className="tw-flex tw-flex-wrap tw-gap-1.5 tw-items-center">
                                                <input type="hidden" name="userId" value={u.id} />
                                                <input name="licenceBody" placeholder="Body (e.g. CICC)" aria-label="Licensing body" required className={smallInput} />
                                                <input name="licenceNumber" placeholder="Licence #" aria-label="Licence number" required className={smallInput} />
                                                <button type="submit" className="tw-text-sm tw-font-medium tw-text-primary">
                                                    Mark verified
                                                </button>
                                            </form>
                                        )}
                                    </Td>
                                    <Td>
                                        <div className="tw-flex tw-items-center tw-gap-2">
                                            <StatusPill tone={u.status === "active" ? "success" : "danger"}>{u.status}</StatusPill>
                                            {u.id !== admin.id && (
                                                <form action={setUserStatusAction}>
                                                    <input type="hidden" name="userId" value={u.id} />
                                                    <input type="hidden" name="status" value={u.status === "active" ? "suspended" : "active"} />
                                                    <button type="submit" className="tw-text-sm tw-text-secondary hover:tw-underline">
                                                        {u.status === "active" ? "Suspend" : "Reactivate"}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            </div>
        </>
    );
}
