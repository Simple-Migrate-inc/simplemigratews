import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Card from "@dashboard-ui/card";
import PageHeader from "@dashboard-ui/page-header";
import StatusPill from "@dashboard-ui/status-pill";
import { Table, Th, Td, EmptyRow } from "@dashboard-ui/table";
import { requireUser } from "@dashboard/auth/session";
import { requireBcpnp } from "@dashboard/bcpnp/feature-flag";
import { db, bcpnpSchema } from "@dashboard/db";
import { saveCommunity } from "../actions";

export const metadata: Metadata = { title: "BC PNP Communities" };
export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
    const user = await requireUser({ area: "superuser" });
    if (user.role !== "superuser" && user.role !== "admin") redirect("/app");
    await requireBcpnp("/app/superuser");

    const communities = await db()
        .select()
        .from(bcpnpSchema.bcpnpCommunity)
        .orderBy(bcpnpSchema.bcpnpCommunity.name);

    return (
        <>
            <PageHeader
                title="Enrolled Communities"
                description="Regional stream communities and their NAICS priorities."
            />
            <div className="tw-grid tw-gap-6">
                <Card title="Add community">
                    <form action={saveCommunity} className="tw-grid sm:tw-grid-cols-2 tw-gap-4">
                        <div>
                            <label htmlFor="c-name" className="tw-block tw-text-sm tw-font-medium tw-mb-1">Community name *</label>
                            <input id="c-name" name="name" type="text" required maxLength={200}
                                className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50" />
                        </div>
                        <div>
                            <label htmlFor="c-region" className="tw-block tw-text-sm tw-font-medium tw-mb-1">Region</label>
                            <input id="c-region" name="region" type="text" maxLength={100}
                                className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50" />
                        </div>
                        <div>
                            <label htmlFor="c-population" className="tw-block tw-text-sm tw-font-medium tw-mb-1">Population</label>
                            <input id="c-population" name="population" type="number" min={1}
                                className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50" />
                        </div>
                        <div>
                            <label htmlFor="c-naics" className="tw-block tw-text-sm tw-font-medium tw-mb-1">Priority NAICS codes (comma-separated)</label>
                            <input id="c-naics" name="naicsPriorities" type="text" placeholder="722512, 811111"
                                className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50" />
                        </div>
                        <div>
                            <label htmlFor="c-contact-name" className="tw-block tw-text-sm tw-font-medium tw-mb-1">Contact name</label>
                            <input id="c-contact-name" name="communityContactName" type="text" maxLength={200}
                                className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50" />
                        </div>
                        <div>
                            <label htmlFor="c-contact-email" className="tw-block tw-text-sm tw-font-medium tw-mb-1">Contact email</label>
                            <input id="c-contact-email" name="communityContactEmail" type="email"
                                className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50" />
                        </div>
                        <div>
                            <label htmlFor="c-contact-url" className="tw-block tw-text-sm tw-font-medium tw-mb-1">Community website URL</label>
                            <input id="c-contact-url" name="communityContactUrl" type="url"
                                className="tw-block tw-w-full tw-border tw-border-gray-500 tw-rounded tw-px-3 tw-py-2 tw-text-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50" />
                        </div>
                        <div className="tw-flex tw-items-end">
                            <button type="submit"
                                className="tw-bg-primary tw-text-white tw-rounded tw-px-5 tw-py-2 tw-text-md tw-font-medium hover:tw-bg-primary/90">
                                Add community
                            </button>
                        </div>
                    </form>
                </Card>

                <Card title={`${communities.length} communities`}>
                    <Table caption="Enrolled communities">
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Region</Th>
                                <Th>Population</Th>
                                <Th>Priority NAICS</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {communities.length === 0 ? (
                                <EmptyRow colSpan={5}>
                                    No communities yet. Add the first one using the form above.
                                </EmptyRow>
                            ) : (
                                communities.map((comm) => (
                                    <tr key={comm.id}>
                                        <Td>
                                            <span className="tw-font-medium tw-text-heading">{comm.name}</span>
                                            {comm.communityContactEmail && (
                                                <span className="tw-block tw-text-sm">{comm.communityContactEmail}</span>
                                            )}
                                        </Td>
                                        <Td>{comm.region ?? "—"}</Td>
                                        <Td>{comm.population?.toLocaleString("en-CA") ?? "—"}</Td>
                                        <Td>
                                            {comm.naicsPriorities.length > 0
                                                ? comm.naicsPriorities.join(", ")
                                                : "—"}
                                        </Td>
                                        <Td>
                                            <StatusPill tone={comm.active ? "success" : "neutral"}>
                                                {comm.active ? "Active" : "Inactive"}
                                            </StatusPill>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card>
            </div>
        </>
    );
}
