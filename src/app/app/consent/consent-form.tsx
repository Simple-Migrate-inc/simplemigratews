"use client";

import { useFormState, useFormStatus } from "react-dom";
import Button from "@ui/button";
import FormMessage from "@dashboard-ui/form-message";
import type { ConsentDefinition } from "@dashboard/auth/legal";
import { acceptConsentsAction } from "./actions";

function Submit() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" fullwidth disabled={pending}>
            {pending ? "Saving…" : "Accept and continue"}
        </Button>
    );
}

export default function ConsentForm({ consents }: { consents: ConsentDefinition[] }) {
    const [state, action] = useFormState<{ error?: string }, FormData>(acceptConsentsAction, {});
    return (
        <form action={action}>
            <FormMessage>{state.error}</FormMessage>
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
            <Submit />
        </form>
    );
}
