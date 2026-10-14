"use client";

import { useFormState, useFormStatus } from "react-dom";
import Button from "@ui/button";
import Field from "@dashboard-ui/field";
import FormMessage from "@dashboard-ui/form-message";
import type { ConsentDefinition } from "@dashboard/auth/legal";
import { type AcceptState, acceptInvitationAction } from "./actions";

function Submit() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" fullwidth disabled={pending}>
            {pending ? "Creating your account…" : "Create account"}
        </Button>
    );
}

export default function AcceptForm({
    token,
    defaultName,
    consents,
}: {
    token: string;
    defaultName?: string;
    consents: readonly ConsentDefinition[];
}) {
    const [state, action] = useFormState<AcceptState, FormData>(
        acceptInvitationAction.bind(null, token),
        {}
    );
    const fe = state.fieldErrors ?? {};

    return (
        <form action={action}>
            <FormMessage>{state.error}</FormMessage>
            <Field label="Full name" name="name" autoComplete="name" defaultValue={defaultName} required error={fe.name} />
            <Field
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                hint="At least 12 characters."
                required
                error={fe.password}
            />
            <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required error={fe.confirm} />

            <fieldset className="tw-mb-6">
                <legend className="tw-text-md tw-font-medium tw-text-heading tw-mb-3">Before you continue</legend>
                {consents.map((c) => (
                    <label key={c.kind} className="tw-flex tw-gap-3 tw-items-start tw-mb-4 tw-text-md tw-cursor-pointer">
                        <input type="checkbox" name="consents" value={c.kind} required className="tw-mt-1.5 tw-shrink-0 tw-accent-primary tw-w-4 tw-h-4" />
                        <span>
                            {c.wording}
                            {c.link && (
                                <>
                                    {" "}
                                    <a href={c.link} target="_blank" rel="noreferrer" className="tw-text-primary tw-underline">
                                        Read the {c.label.toLowerCase()}
                                    </a>
                                </>
                            )}
                        </span>
                    </label>
                ))}
                {fe.consents && <p className="tw-text-sm tw-text-danger">{fe.consents}</p>}
            </fieldset>

            <Submit />
        </form>
    );
}
