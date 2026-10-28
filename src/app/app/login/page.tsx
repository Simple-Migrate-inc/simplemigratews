import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@dashboard-ui/auth-card";
import { getCurrentUser } from "@dashboard/auth/session";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
    inactive: "This account is not active. Contact Simple Migrate if you think this is a mistake.",
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: { next?: string; error?: string };
}) {
    const user = await getCurrentUser();
    if (user && user.status === "active") redirect("/app");

    // Only allow same-site relative redirects after sign-in.
    const next = searchParams.next?.startsWith("/app") ? searchParams.next : "/app";

    return (
        <AuthCard
            title="Client sign in"
            subtitle="Access is by invitation. Use the email address your invitation was sent to."
        >
            <LoginForm next={next} initialError={searchParams.error ? ERRORS[searchParams.error] : undefined} />
        </AuthCard>
    );
}
