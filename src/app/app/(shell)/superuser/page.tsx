import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import { requireUser } from "@dashboard/auth/session";
import { isBcpnpEnabled } from "@dashboard/bcpnp/feature-flag";

export const metadata: Metadata = { title: "Superuser Overview" };
export const dynamic = "force-dynamic";

export default async function SuperuserHome() {
    const user = await requireUser({ area: "superuser" });
    if (user.role !== "superuser" && user.role !== "admin") redirect("/app");

    const bcpnpOn = await isBcpnpEnabled();

    return (
        <>
            <PageHeader title="Overview" description="SimpleMigrate platform management." />
            <div className="tw-grid md:tw-grid-cols-2 tw-gap-6">
                <Card title="BC PNP Entrepreneur Immigration">
                    {bcpnpOn ? (
                        <p className="tw-mb-4 tw-text-md">
                            The BC PNP case platform is <strong className="tw-text-success">active</strong>.
                        </p>
                    ) : (
                        <p className="tw-mb-4 tw-text-md">
                            The BC PNP case platform is{" "}
                            <strong className="tw-text-danger">disabled</strong>. Enable it below to let
                            candidates access their cases.
                        </p>
                    )}
                    <div className="tw-flex tw-gap-3 tw-flex-wrap">
                        <Link
                            href="/app/superuser/bcpnp"
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-md tw-font-medium tw-text-primary hover:tw-underline"
                        >
                            <i className="fas fa-briefcase" aria-hidden />
                            Pipeline
                        </Link>
                        <Link
                            href="/app/superuser/bcpnp/communities"
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-md tw-font-medium tw-text-primary hover:tw-underline"
                        >
                            <i className="fas fa-map-marker-alt" aria-hidden />
                            Communities
                        </Link>
                        <Link
                            href="/app/superuser/bcpnp/rules"
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-md tw-font-medium tw-text-primary hover:tw-underline"
                        >
                            <i className="fas fa-book" aria-hidden />
                            Rule Library
                        </Link>
                    </div>
                </Card>
            </div>
        </>
    );
}
