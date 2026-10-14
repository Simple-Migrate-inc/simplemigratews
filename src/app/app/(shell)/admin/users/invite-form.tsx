"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Button from "@ui/button";
import Field from "@dashboard-ui/field";
import FormMessage from "@dashboard-ui/form-message";
import { ROLE_LABEL, ROLES } from "@dashboard/auth/roles";
import { type InviteState, inviteUserAction } from "../actions";

const selectCls = "tw-block tw-w-full tw-h-14 tw-rounded tw-px-4 tw-text-base tw-text-body tw-border tw-border-gray-200 tw-bg-white focus:tw-border-primary focus:tw-outline-0";

function Submit() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send invitation"}
        </Button>
    );
}

export default function InviteForm({
    cohorts,
    partners,
}: {
    cohorts: { id: string; name: string }[];
    partners: { id: string; firm: string }[];
}) {
    const [state, action] = useFormState<InviteState, FormData>(inviteUserAction, {});
    const [role, setRole] = useState("candidate");
    const fe = state.fieldErrors ?? {};

    return (
        <form action={action} key={state.ok}>
            <FormMessage tone="success">
                {state.ok}
                {state.devUrl && (
                    <span className="tw-block tw-mt-2 tw-break-all tw-text-sm">
                        Email delivery is off on this server, so share this single-use link yourself: <a href={state.devUrl} className="tw-underline">{state.devUrl}</a>
                    </span>
                )}
            </FormMessage>
            <FormMessage>{state.error}</FormMessage>
            <div className="tw-grid md:tw-grid-cols-2 tw-gap-x-5">
                <Field label="Email" name="email" type="email" required error={fe.email} />
                <Field label="Name (optional)" name="name" error={fe.name} />
                <div className="tw-mb-5">
                    <label htmlFor="f-role" className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-2">
                        Role <span className="tw-text-danger" aria-hidden>*</span>
                    </label>
                    <select id="f-role" name="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
                        {ROLES.map((r) => (
                            <option key={r} value={r}>
                                {ROLE_LABEL[r]}
                            </option>
                        ))}
                    </select>
                </div>
                {role === "candidate" && (
                    <div className="tw-mb-5">
                        <label htmlFor="f-cohort" className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-2">
                            Cohort
                        </label>
                        <select id="f-cohort" name="cohortId" defaultValue={cohorts[0]?.id ?? ""} className={selectCls}>
                            <option value="">No cohort</option>
                            {cohorts.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {role === "partner" && (
                    <div className="tw-mb-5">
                        <label htmlFor="f-partner" className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-2">
                            Partner firm <span className="tw-text-danger" aria-hidden>*</span>
                        </label>
                        <select id="f-partner" name="partnerId" defaultValue="" className={selectCls}>
                            <option value="" disabled>
                                Choose a firm
                            </option>
                            {partners.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.firm}
                                </option>
                            ))}
                        </select>
                        {fe.partnerId && <p className="tw-text-sm tw-text-danger tw-mt-1">{fe.partnerId}</p>}
                    </div>
                )}
            </div>
            <Submit />
        </form>
    );
}
