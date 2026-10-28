"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@ui/button";
import Field from "@dashboard-ui/field";
import FormMessage from "@dashboard-ui/form-message";
import { authClient } from "@dashboard/auth/client";

export default function TwoFactorForm({ next }: { next: string }) {
    const router = useRouter();
    const [useBackup, setUseBackup] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const code = String(new FormData(e.currentTarget).get("code") || "").replace(/\s/g, "");
        const { error: err } = useBackup
            ? await authClient.twoFactor.verifyBackupCode({ code })
            : await authClient.twoFactor.verifyTotp({ code });
        setBusy(false);
        if (err) {
            setError(err.status === 429 ? "Too many attempts. Please wait and try again." : "That code didn't work. Check it and try again.");
            return;
        }
        router.push(next);
        router.refresh();
    };

    return (
        <>
            <p className="tw-text-md tw-mb-6">
                {useBackup ? "Enter one of your backup codes." : "Enter the 6-digit code from your authenticator app."}
            </p>
            <form onSubmit={onSubmit}>
                <FormMessage>{error}</FormMessage>
                <Field
                    label={useBackup ? "Backup code" : "Authentication code"}
                    name="code"
                    autoComplete="one-time-code"
                    inputMode={useBackup ? "text" : "numeric"}
                    required
                />
                <Button type="submit" fullwidth disabled={busy}>
                    {busy ? "Checking…" : "Verify"}
                </Button>
                <button
                    type="button"
                    className="tw-block tw-mx-auto tw-mt-5 tw-text-md tw-text-secondary hover:tw-text-primary"
                    onClick={() => setUseBackup(!useBackup)}
                >
                    {useBackup ? "Use authenticator app instead" : "Use a backup code"}
                </button>
            </form>
        </>
    );
}
