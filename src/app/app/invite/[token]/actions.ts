"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@dashboard/auth/auth";
import { InvitationError, acceptInvitation } from "@dashboard/auth/invitations";
import { REQUIRED_CONSENTS } from "@dashboard/auth/legal";

export type AcceptState = { error?: string; fieldErrors?: Record<string, string> };

const schema = z
    .object({
        name: z.string().trim().min(2, "Enter your full name").max(120),
        password: z.string().min(12, "Use at least 12 characters").max(128),
        confirm: z.string(),
        consents: z.array(z.string()),
    })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" })
    .refine((v) => REQUIRED_CONSENTS.every((c) => v.consents.includes(c.kind)), {
        path: ["consents"],
        message: "Please accept each item to continue",
    });

export async function acceptInvitationAction(
    token: string,
    _prev: AcceptState,
    form: FormData
): Promise<AcceptState> {
    const parsed = schema.safeParse({
        name: form.get("name"),
        password: form.get("password"),
        confirm: form.get("confirm"),
        consents: form.getAll("consents"),
    });
    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
        return { fieldErrors };
    }

    const h = headers();
    let email: string;
    try {
        ({ email } = await acceptInvitation({
            token,
            name: parsed.data.name,
            password: parsed.data.password,
            ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
            userAgent: h.get("user-agent"),
        }));
    } catch (e) {
        if (e instanceof InvitationError) return { error: e.message };
        throw e;
    }

    await auth().api.signInEmail({ body: { email, password: parsed.data.password }, headers: h });
    redirect("/app");
}
