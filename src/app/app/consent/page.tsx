import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@dashboard-ui/auth-card";
import { missingConsents, requireUser } from "@dashboard/auth/session";
import ConsentForm from "./consent-form";

export const metadata: Metadata = { title: "Updated terms" };
export const dynamic = "force-dynamic";

export default async function ConsentPage() {
    const user = await requireUser({ skipGates: true });
    const missing = await missingConsents(user.id);
    if (missing.length === 0) redirect("/app");
    return (
        <AuthCard title="Please review and accept" subtitle="Our terms have been updated since you last accepted them.">
            <ConsentForm consents={[...missing]} />
        </AuthCard>
    );
}
