"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@dashboard/db";
import { audit } from "@dashboard/audit";
import { requireUser, missingConsents } from "@dashboard/auth/session";

export async function acceptConsentsAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
    const user = await requireUser({ skipGates: true });
    const missing = await missingConsents(user.id);
    const accepted = form.getAll("consents").map(String);
    if (!missing.every((c) => accepted.includes(c.kind))) {
        return { error: "Please accept each item to continue." };
    }
    const h = headers();
    if (missing.length > 0) {
        await db()
            .insert(schema.consentRecord)
            .values(
                missing.map((c) => ({
                    userId: user.id,
                    kind: c.kind,
                    version: c.version,
                    wording: c.wording,
                    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
                    userAgent: h.get("user-agent"),
                }))
            );
        await audit({ actorId: user.id, action: "consent.accept", objectType: "user", objectId: user.id, meta: { kinds: missing.map((c) => c.kind) } });
    }
    redirect("/app");
}
