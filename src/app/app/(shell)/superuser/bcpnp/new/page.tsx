import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { db, bcpnpSchema } from "@dashboard/db";
import { createBcpnpCase } from "../actions";

export const metadata: Metadata = { title: "New BC PNP Case" };
export const dynamic = "force-dynamic";

export default async function NewBcpnpCase() {
    const user = await requireUser({ area: "superuser" });
    if (user.role !== "superuser" && user.role !== "admin") redirect("/app");
    await requireBcpnp("/app/superuser");

    const editions = await db()
        .select({ id: bcpnpSchema.bcpnpGuideEdition.id, label: bcpnpSchema.bcpnpGuideEdition.label })
        .from(bcpnpSchema.bcpnpGuideEdition)
        .orderBy(bcpnpSchema.bcpnpGuideEdition.effectiveFrom);

    return (
        <>
            <PageHeader title="New BC PNP Case" description="Open a new case for a registered candidate." />
            <Card className="tw-max-w-lg">
                <form action={createBcpnpCase} className="tw-grid tw-gap-5">
                    <div>
                        <label htmlFor="applicantEmail" className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-1">
                            Applicant email
                        </label>
                        <input
                            id="applicantEmail"
                            name="applicantEmail"
                            type="email"
                            required
                            placeholder="candidate@example.com"
                            className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
                        />
                        <p className="tw-text-sm tw-mt-1">Must match an existing candidate account.</p>
                    </div>

                    <div>
                        <label htmlFor="stream" className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-1">
                            Stream
                        </label>
                        <select
                            id="stream"
                            name="stream"
                            required
                            className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
                        >
                            <option value="">Select…</option>
                            <option value="base">Base</option>
                            <option value="regional">Regional</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="guideEditionId" className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-1">
                            Guide edition
                        </label>
                        <select
                            id="guideEditionId"
                            name="guideEditionId"
                            required
                            className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
                        >
                            <option value="">Select…</option>
                            {editions.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes" className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-1">
                            Internal notes (optional)
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            maxLength={1000}
                            className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
                        />
                    </div>

                    <div className="tw-flex tw-gap-3">
                        <button
                            type="submit"
                            className="tw-bg-primary tw-text-white tw-rounded tw-px-5 tw-py-2 tw-text-md tw-font-medium hover:tw-bg-primary/90"
                        >
                            Create case
                        </button>
                        <a
                            href="/app/superuser/bcpnp"
                            className="tw-text-md tw-text-secondary hover:tw-text-primary tw-py-2"
                        >
                            Cancel
                        </a>
                    </div>
                </form>
            </Card>
        </>
    );
}
