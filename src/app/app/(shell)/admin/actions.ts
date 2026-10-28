"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@dashboard/audit";
import { createInvitation } from "@dashboard/auth/invitations";
import { ROLES } from "@dashboard/auth/roles";
import { requireUser } from "@dashboard/auth/session";
import { db, schema } from "@dashboard/db";
import { emailDriver } from "@dashboard/env";

export type InviteState = { ok?: string; devUrl?: string; error?: string; fieldErrors?: Record<string, string> };

const inviteSchema = z
    .object({
        email: z.string().trim().toLowerCase().email("Enter a valid email"),
        name: z.string().trim().max(120).optional(),
        role: z.enum(ROLES as [string, ...string[]]),
        cohortId: z.string().uuid().optional().or(z.literal("")),
        partnerId: z.string().uuid().optional().or(z.literal("")),
    })
    .refine((v) => v.role !== "partner" || !!v.partnerId, { path: ["partnerId"], message: "Choose the partner firm" });

export async function inviteUserAction(_prev: InviteState, form: FormData): Promise<InviteState> {
    const admin = await requireUser({ area: "admin" });
    const parsed = inviteSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
        return { fieldErrors };
    }
    const v = parsed.data;
    const existing = await db().select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, v.email)).limit(1);
    if (existing.length) return { fieldErrors: { email: "A user with this email already exists" } };

    const { url } = await createInvitation({
        email: v.email,
        name: v.name || undefined,
        role: v.role as (typeof ROLES)[number],
        invitedBy: admin.id,
        cohortId: v.cohortId || null,
        partnerId: v.partnerId || null,
    });
    revalidatePath("/app/admin/users");
    return {
        ok: `Invitation sent to ${v.email}. It expires in 7 days.`,
        // When email isn't actually delivered, the admin shares the link by hand.
        devUrl: emailDriver() === "log" ? url : undefined,
    };
}

export async function revokeInvitationAction(form: FormData) {
    const admin = await requireUser({ area: "admin" });
    const id = z.string().uuid().parse(form.get("id"));
    await db().update(schema.invitation).set({ revokedAt: new Date() }).where(eq(schema.invitation.id, id));
    await audit({ actorId: admin.id, action: "invitation.revoke", objectType: "invitation", objectId: id });
    revalidatePath("/app/admin/users");
}

export async function assignConsultantAction(form: FormData) {
    const admin = await requireUser({ area: "admin" });
    const caseId = z.string().uuid().parse(form.get("caseId"));
    const consultantId = z.string().min(1).nullable().parse(form.get("consultantId") || null);
    if (consultantId) {
        const [c] = await db()
            .select({ id: schema.user.id })
            .from(schema.user)
            .where(and(eq(schema.user.id, consultantId), eq(schema.user.role, "consultant")))
            .limit(1);
        if (!c) throw new Error("Not a consultant");
    }
    await db().update(schema.dashCase).set({ consultantId }).where(eq(schema.dashCase.id, caseId));
    await audit({ actorId: admin.id, action: "case.assign_consultant", objectType: "case", objectId: caseId, caseId, meta: { consultantId } });
    revalidatePath("/app/admin");
}

export async function setUserStatusAction(form: FormData) {
    const admin = await requireUser({ area: "admin" });
    const userId = z.string().min(1).parse(form.get("userId"));
    const status = z.enum(["active", "suspended"]).parse(form.get("status"));
    if (userId === admin.id) throw new Error("You can't change your own status");
    await db().update(schema.user).set({ status }).where(eq(schema.user.id, userId));
    if (status === "suspended") {
        // End their sessions immediately.
        await db().delete(schema.session).where(eq(schema.session.userId, userId));
    }
    await audit({ actorId: admin.id, action: `user.${status}`, objectType: "user", objectId: userId });
    revalidatePath("/app/admin/users");
}

export async function verifyLicenceAction(form: FormData) {
    const admin = await requireUser({ area: "admin" });
    const userId = z.string().min(1).parse(form.get("userId"));
    const licenceNumber = z.string().trim().min(3).max(40).parse(form.get("licenceNumber"));
    const licenceBody = z.string().trim().min(2).max(80).parse(form.get("licenceBody"));
    await db()
        .update(schema.user)
        .set({ licenceNumber, licenceBody, licenceVerifiedAt: new Date() })
        .where(and(eq(schema.user.id, userId), eq(schema.user.role, "consultant")));
    await audit({ actorId: admin.id, action: "user.licence_verify", objectType: "user", objectId: userId, meta: { licenceBody } });
    revalidatePath("/app/admin/users");
}
