"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { audit } from "@dashboard/audit";
import { requireUser } from "@dashboard/auth/session";
import { db, gpSchema } from "@dashboard/db";
import { canPartner, buildGpActor } from "../../../../../../../lib/partners/permissions";


async function getActorAndApp(appId: string, requireSuperuser = false) {
    const user = await requireUser({ area: "admin" });
    const actor = buildGpActor({ userId: user.id, role: user.role });

    if (requireSuperuser && !canPartner(actor, "application.approve")) {
        throw new Error("Only a superuser can perform this action.");
    }

    const [app] = await db()
        .select()
        .from(gpSchema.gpApplication)
        .where(eq(gpSchema.gpApplication.id, appId))
        .limit(1);

    if (!app) throw new Error("Application not found.");

    return { user, actor, app };
}

export async function screenApplicationAction(formData: FormData): Promise<void> {
    try {
        const appId = formData.get("appId") as string;
        const { user, actor } = await getActorAndApp(appId);
        if (!canPartner(actor, "application.screen")) throw new Error("Not authorised.");

        await db()
            .update(gpSchema.gpApplication)
            .set({ status: "screening", reviewedBy: user.id, updatedAt: new Date() })
            .where(eq(gpSchema.gpApplication.id, appId));

        await audit({ actorId: user.id, action: "partner_application.screen", objectType: "gp_application", objectId: appId });
        revalidatePath(`/app/admin/partners/applications/${appId}`);
    } catch (e) {
        console.error("[partner action]", e);
        throw e;
    }
}

export async function scheduleApplicationAction(formData: FormData): Promise<void> {
    try {
        const appId    = formData.get("appId") as string;
        const meetingAt = formData.get("meetingAt") as string;
        const { user, actor } = await getActorAndApp(appId);
        if (!canPartner(actor, "application.schedule")) throw new Error("Not authorised.");

        const meetingDate = meetingAt ? new Date(meetingAt) : null;
        await db()
            .update(gpSchema.gpApplication)
            .set({
                status:    "meeting_scheduled",
                meetingAt: meetingDate,
                reviewedBy: user.id,
                updatedAt: new Date(),
            })
            .where(eq(gpSchema.gpApplication.id, appId));

        await audit({
            actorId:    user.id,
            action:     "partner_application.schedule",
            objectType: "gp_application",
            objectId:   appId,
            meta:       { meetingAt: meetingDate?.toISOString() },
        });
        revalidatePath(`/app/admin/partners/applications/${appId}`);
    } catch (e) {
        console.error("[partner action]", e);
        throw e;
    }
}

export async function kycApplicationAction(formData: FormData): Promise<void> {
    try {
        const appId = formData.get("appId") as string;
        const { user, actor } = await getActorAndApp(appId);
        if (!canPartner(actor, "application.kyc")) throw new Error("Not authorised.");

        await db()
            .update(gpSchema.gpApplication)
            .set({ status: "due_diligence", reviewedBy: user.id, updatedAt: new Date() })
            .where(eq(gpSchema.gpApplication.id, appId));

        await audit({ actorId: user.id, action: "partner_application.kyc", objectType: "gp_application", objectId: appId });
        revalidatePath(`/app/admin/partners/applications/${appId}`);
    } catch (e) {
        console.error("[partner action]", e);
        throw e;
    }
}

export async function approveApplicationAction(formData: FormData): Promise<void> {
    try {
        const appId = formData.get("appId") as string;
        const { user, actor, app } = await getActorAndApp(appId, true);
        if (!canPartner(actor, "application.approve")) throw new Error("Only superuser can approve.");

        // Create the gp_org record
        await db().transaction(async (tx) => {
            const [org] = await tx
                .insert(gpSchema.gpOrg)
                .values({
                    name:          app.company,
                    type:          app.type,
                    status:        "active",
                    tier:          "registered",
                    applicationId: app.id,
                    managerUserId: user.id,
                })
                .returning({ id: gpSchema.gpOrg.id });

            await tx
                .update(gpSchema.gpApplication)
                .set({ status: "approved", reviewedBy: user.id, updatedAt: new Date() })
                .where(eq(gpSchema.gpApplication.id, appId));

            await audit({ actorId: user.id, action: "partner_application.approve", objectType: "gp_application", objectId: appId, meta: { orgId: org.id } });
        });

        revalidatePath("/app/admin/partners/applications");
        revalidatePath(`/app/admin/partners/applications/${appId}`);
    } catch (e) {
        console.error("[partner action]", e);
        throw e;
    }
}

export async function waitlistApplicationAction(formData: FormData): Promise<void> {
    try {
        const appId = formData.get("appId") as string;
        const { user, actor } = await getActorAndApp(appId);
        if (!canPartner(actor, "application.waitlist")) throw new Error("Not authorised.");

        await db()
            .update(gpSchema.gpApplication)
            .set({ status: "waitlisted", reviewedBy: user.id, updatedAt: new Date() })
            .where(eq(gpSchema.gpApplication.id, appId));

        await audit({ actorId: user.id, action: "partner_application.waitlist", objectType: "gp_application", objectId: appId });
        revalidatePath(`/app/admin/partners/applications/${appId}`);
    } catch (e) {
        console.error("[partner action]", e);
        throw e;
    }
}

export async function declineApplicationAction(formData: FormData): Promise<void> {
    try {
        const appId      = formData.get("appId") as string;
        const reasonCode = (formData.get("reasonCode") as string | null) || "not_a_fit";
        const { user, actor } = await getActorAndApp(appId, true);
        if (!canPartner(actor, "application.decline")) throw new Error("Only superuser can decline.");

        await db()
            .update(gpSchema.gpApplication)
            .set({
                status:            "declined",
                declineReasonCode: reasonCode,
                reviewedBy:        user.id,
                updatedAt:         new Date(),
            })
            .where(eq(gpSchema.gpApplication.id, appId));

        await audit({ actorId: user.id, action: "partner_application.decline", objectType: "gp_application", objectId: appId, meta: { reasonCode } });
        revalidatePath(`/app/admin/partners/applications/${appId}`);
    } catch (e) {
        console.error("[partner action]", e);
        throw e;
    }
}
