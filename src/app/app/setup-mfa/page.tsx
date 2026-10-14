import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@dashboard-ui/auth-card";
import { requireUser } from "@dashboard/auth/session";
import { requiresMfa } from "@dashboard/auth/roles";
import SetupMfaForm from "./setup-mfa-form";

export const metadata: Metadata = { title: "Set up two-step verification" };
export const dynamic = "force-dynamic";

export default async function SetupMfaPage() {
    const user = await requireUser({ skipGates: true });
    if (user.twoFactorEnabled) redirect("/app/account");

    return (
        <AuthCard
            title="Set up two-step verification"
            subtitle={
                requiresMfa(user.role)
                    ? "Your role has access to client files, so an authenticator app is required. You'll need an app such as Google Authenticator, 1Password or Authy."
                    : "Add an authenticator app for extra protection on your account."
            }
        >
            <SetupMfaForm />
        </AuthCard>
    );
}
