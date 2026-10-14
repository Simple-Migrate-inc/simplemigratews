import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@dashboard-ui/auth-card";
import { findOpenInvitation } from "@dashboard/auth/invitations";
import { REQUIRED_CONSENTS } from "@dashboard/auth/legal";
import { ROLE_LABEL } from "@dashboard/auth/roles";
import AcceptForm from "./accept-form";

export const metadata: Metadata = { title: "Accept invitation" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: { token: string } }) {
    const invite = await findOpenInvitation(params.token);

    if (!invite) {
        return (
            <AuthCard title="Invitation not available">
                <p className="tw-text-md tw-mb-5">
                    This link is invalid, has already been used, or has expired. Invitation links work once and
                    expire after 7 days. Ask your Simple Migrate contact to send a new one.
                </p>
                <Link href="/app/login" className="tw-text-primary tw-font-medium">
                    Go to sign in
                </Link>
            </AuthCard>
        );
    }

    return (
        <AuthCard
            title="Set up your account"
            subtitle={
                <>
                    You're joining as a <strong>{ROLE_LABEL[invite.role].toLowerCase()}</strong> with{" "}
                    <strong>{invite.email}</strong>.
                </>
            }
        >
            <AcceptForm token={params.token} defaultName={invite.name ?? undefined} consents={REQUIRED_CONSENTS} />
        </AuthCard>
    );
}
