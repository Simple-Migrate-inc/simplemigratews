"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@ui/button";
import Field from "@dashboard-ui/field";
import FormMessage from "@dashboard-ui/form-message";
import { authClient } from "@dashboard/auth/client";

export default function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
    const router = useRouter();
    const [mode, setMode] = useState<"password" | "magic">("password");
    const [error, setError] = useState(initialError ?? "");
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") || "").trim();
        try {
            if (mode === "magic") {
                const { error: err } = await authClient.signIn.magicLink({ email, callbackURL: next });
                // Same message whether or not the account exists.
                if (err && err.status !== 400) throw new Error(err.message);
                setSent(true);
                return;
            }
            const { data, error: err } = await authClient.signIn.email({
                email,
                password: String(form.get("password") || ""),
            });
            if (err) {
                setError(err.status === 429 ? "Too many attempts. Please wait a minute and try again." : "Email or password is incorrect.");
                return;
            }
            if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
                router.push(`/app/login/two-factor?next=${encodeURIComponent(next)}`);
                return;
            }
            router.push(next);
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    if (sent) {
        return (
            <FormMessage tone="success">
                If an account exists for that email, a sign-in link is on its way. It expires in 10 minutes.
            </FormMessage>
        );
    }

    return (
        <form onSubmit={onSubmit} noValidate={false}>
            <FormMessage>{error}</FormMessage>
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            {mode === "password" && (
                <Field label="Password" name="password" type="password" autoComplete="current-password" required />
            )}
            <Button type="submit" fullwidth disabled={busy}>
                {busy ? "Please wait…" : mode === "password" ? "Sign in" : "Email me a sign-in link"}
            </Button>
            <button
                type="button"
                className="tw-block tw-mx-auto tw-mt-5 tw-text-md tw-text-secondary hover:tw-text-primary"
                onClick={() => {
                    setMode(mode === "password" ? "magic" : "password");
                    setError("");
                }}
            >
                {mode === "password" ? "Sign in with an email link instead" : "Sign in with a password instead"}
            </button>
        </form>
    );
}
