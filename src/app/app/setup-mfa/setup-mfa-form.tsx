"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import Button from "@ui/button";
import Field from "@dashboard-ui/field";
import FormMessage from "@dashboard-ui/form-message";
import { authClient } from "@dashboard/auth/client";

type Enrolment = { qr: string; secret: string; backupCodes: string[] };

export default function SetupMfaForm() {
    const router = useRouter();
    const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const start = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const password = String(new FormData(e.currentTarget).get("password") || "");
        const { data, error: err } = await authClient.twoFactor.enable({ password });
        setBusy(false);
        if (err || !data || !("totpURI" in data)) {
            setError("That password is incorrect.");
            return;
        }
        const secret = new URL(data.totpURI).searchParams.get("secret") ?? "";
        setEnrolment({ qr: await QRCode.toDataURL(data.totpURI, { margin: 1, width: 200 }), secret, backupCodes: data.backupCodes });
    };

    const verify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const code = String(new FormData(e.currentTarget).get("code") || "").replace(/\s/g, "");
        const { error: err } = await authClient.twoFactor.verifyTotp({ code });
        setBusy(false);
        if (err) {
            setError("That code didn't work. Make sure your phone's clock is correct and try the newest code.");
            return;
        }
        router.push("/app");
        router.refresh();
    };

    if (!enrolment) {
        return (
            <form onSubmit={start}>
                <FormMessage>{error}</FormMessage>
                <Field label="Confirm your password" name="password" type="password" autoComplete="current-password" required />
                <Button type="submit" fullwidth disabled={busy}>
                    {busy ? "Please wait…" : "Continue"}
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={verify}>
            <FormMessage>{error}</FormMessage>
            <ol className="tw-list-decimal tw-pl-5 tw-text-md tw-space-y-4 tw-mb-6">
                <li>
                    Scan this code with your authenticator app.
                    <img src={enrolment.qr} alt="QR code for your authenticator app" width={200} height={200} className="tw-my-3 tw-border tw-border-gray-500 tw-rounded" />
                    <span className="tw-block tw-text-sm">
                        Can't scan? Enter this key: <code className="tw-break-all tw-text-heading">{enrolment.secret}</code>
                    </span>
                </li>
                <li>
                    Save these backup codes somewhere safe. Each works once if you lose your phone.
                    <ul className="tw-grid tw-grid-cols-2 tw-gap-1 tw-mt-2 tw-font-mono tw-text-sm tw-text-heading tw-bg-gray-200 tw-rounded tw-p-3">
                        {enrolment.backupCodes.map((c) => (
                            <li key={c}>{c}</li>
                        ))}
                    </ul>
                </li>
                <li>Enter the 6-digit code from the app to finish.</li>
            </ol>
            <Field label="Authentication code" name="code" autoComplete="one-time-code" inputMode="numeric" required />
            <Button type="submit" fullwidth disabled={busy}>
                {busy ? "Checking…" : "Turn on two-step verification"}
            </Button>
        </form>
    );
}
