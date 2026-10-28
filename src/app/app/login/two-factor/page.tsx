import type { Metadata } from "next";
import AuthCard from "@dashboard-ui/auth-card";
import TwoFactorForm from "./two-factor-form";

export const metadata: Metadata = { title: "Two-step verification" };
export const dynamic = "force-dynamic";

export default function TwoFactorPage({ searchParams }: { searchParams: { next?: string } }) {
    const next = searchParams.next?.startsWith("/app") ? searchParams.next : "/app";
    return (
        <AuthCard title="Two-step verification">
            <TwoFactorForm next={next} />
        </AuthCard>
    );
}
