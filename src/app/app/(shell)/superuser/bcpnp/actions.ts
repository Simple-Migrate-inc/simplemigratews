"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, bcpnpSchema, schema } from "@dashboard/db";
import { requireUser } from "@dashboard/auth/session";
import { audit } from "@dashboard/audit";
import { isBcpnpEnabled } from "@dashboard/bcpnp/feature-flag";
import { computeDeadlines } from "@dashboard/bcpnp/deadlines";
import { loadRules } from "@dashboard/bcpnp/rules";

async function requireSuperuser() {
    const user = await requireUser({ area: "superuser" });
    if (user.role !== "superuser" && user.role !== "admin") {
        throw new Error("Forbidden");
    }
    if (!(await isBcpnpEnabled())) throw new Error("BC PNP is disabled");
    return user;
}

// ─── Create BC PNP case ───────────────────────────────────────────────────────

const createCaseSchema = z.object({
    applicantEmail: z.string().email(),
    stream: z.enum(["base", "regional"]),
    guideEditionId: z.string().uuid(),
    notes: z.string().max(1000).optional(),
});

export async function createBcpnpCase(formData: FormData) {
    const user = await requireSuperuser();

    const parsed = createCaseSchema.safeParse({
        applicantEmail: formData.get("applicantEmail"),
        stream: formData.get("stream"),
        guideEditionId: formData.get("guideEditionId"),
        notes: formData.get("notes") || undefined,
    });
    if (!parsed.success) {
        redirect(
            `/app/superuser/bcpnp/new?error=${encodeURIComponent("Invalid form data. Check all fields.")}`
        );
    }

    const [applicant] = await db()
        .select({ id: schema.user.id, role: schema.user.role })
        .from(schema.user)
        .where(eq(schema.user.email, parsed.data.applicantEmail.toLowerCase()))
        .limit(1);

    if (!applicant)
        redirect(`/app/superuser/bcpnp/new?error=${encodeURIComponent("No user found with that email address.")}`);
    if (applicant.role !== "candidate")
        redirect(
            `/app/superuser/bcpnp/new?error=${encodeURIComponent("The user must have the candidate role.")}`
        );

    const [newCase] = await db()
        .insert(bcpnpSchema.bcpnpCase)
        .values({
            applicantId: applicant.id,
            superuserId: user.id,
            guideEditionId: parsed.data.guideEditionId,
            stream: parsed.data.stream,
            notes: parsed.data.notes,
        })
        .returning({ id: bcpnpSchema.bcpnpCase.id });

    await audit({
        actorId: user.id,
        action: "bcpnp_case.create",
        objectType: "bcpnp_case",
        objectId: newCase.id,
        caseId: newCase.id,
        meta: { stream: parsed.data.stream, applicantId: applicant.id },
    });

    redirect(`/app/superuser/bcpnp/${newCase.id}`);
}

// ─── Advance stage ────────────────────────────────────────────────────────────

const advanceStageSchema = z.object({
    caseId: z.string().uuid(),
    newStage: z.enum([
        "intake_eligibility",
        "business_concept",
        "exploratory_visit",
        "registration",
        "qualified_pool",
        "application",
        "interview_performance",
        "work_permit_arrival",
        "business_establishment",
        "final_report_nomination",
    ]),
});

export async function advanceBcpnpStage(formData: FormData) {
    const user = await requireSuperuser();

    const parsed = advanceStageSchema.safeParse({
        caseId: formData.get("caseId"),
        newStage: formData.get("newStage"),
    });
    if (!parsed.success) return;

    await db()
        .update(bcpnpSchema.bcpnpCase)
        .set({ stage: parsed.data.newStage })
        .where(eq(bcpnpSchema.bcpnpCase.id, parsed.data.caseId));

    await audit({
        actorId: user.id,
        action: "bcpnp_case.stage_advance",
        objectType: "bcpnp_case",
        objectId: parsed.data.caseId,
        caseId: parsed.data.caseId,
        meta: { newStage: parsed.data.newStage },
    });

    revalidatePath(`/app/superuser/bcpnp/${parsed.data.caseId}`);
}

// ─── Record anchor event (triggers deadline creation) ────────────────────────

const recordEventSchema = z.object({
    caseId: z.string().uuid(),
    eventKey: z.string().min(1).max(100),
    occurredAt: z.string().min(1),
    notes: z.string().max(500).optional(),
});

export async function recordBcpnpEvent(formData: FormData) {
    const user = await requireSuperuser();

    const parsed = recordEventSchema.safeParse({
        caseId: formData.get("caseId"),
        eventKey: formData.get("eventKey"),
        occurredAt: formData.get("occurredAt"),
        notes: formData.get("notes") || undefined,
    });
    if (!parsed.success) return;

    const occurredAt = new Date(parsed.data.occurredAt);

    // Upsert the event
    await db()
        .insert(bcpnpSchema.bcpnpCaseEvent)
        .values({
            caseId: parsed.data.caseId,
            eventKey: parsed.data.eventKey,
            occurredAt,
            recordedBy: user.id,
            notes: parsed.data.notes,
        })
        .onConflictDoUpdate({
            target: [bcpnpSchema.bcpnpCaseEvent.caseId, bcpnpSchema.bcpnpCaseEvent.eventKey],
            set: { occurredAt, recordedBy: user.id, notes: parsed.data.notes },
        });

    // Load the case to get stream and guide edition
    const [c] = await db()
        .select({
            stream: bcpnpSchema.bcpnpCase.stream,
            guideEditionId: bcpnpSchema.bcpnpCase.guideEditionId,
        })
        .from(bcpnpSchema.bcpnpCase)
        .where(eq(bcpnpSchema.bcpnpCase.id, parsed.data.caseId))
        .limit(1);

    if (c?.stream && c?.guideEditionId) {
        const rules = await loadRules(c.guideEditionId, c.stream);
        const specs = computeDeadlines(parsed.data.eventKey, occurredAt, c.stream, rules);

        // Load the event id
        const [ev] = await db()
            .select({ id: bcpnpSchema.bcpnpCaseEvent.id })
            .from(bcpnpSchema.bcpnpCaseEvent)
            .where(eq(bcpnpSchema.bcpnpCaseEvent.caseId, parsed.data.caseId))
            .limit(1);

        if (specs.length > 0 && ev) {
            await db().insert(bcpnpSchema.bcpnpDeadline).values(
                specs.map((s) => ({
                    caseId: parsed.data.caseId,
                    ruleKey: s.ruleKey,
                    label: s.label,
                    anchorEventId: ev.id,
                    dueAt: s.dueAt,
                    remindersSentAt: [],
                }))
            );
        }
    }

    await audit({
        actorId: user.id,
        action: "bcpnp_case_event.record",
        objectType: "bcpnp_case",
        objectId: parsed.data.caseId,
        caseId: parsed.data.caseId,
        meta: { eventKey: parsed.data.eventKey, occurredAt: occurredAt.toISOString() },
    });

    revalidatePath(`/app/superuser/bcpnp/${parsed.data.caseId}`);
}

// ─── Community CRUD ───────────────────────────────────────────────────────────

const saveCommunitySchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    region: z.string().max(100).optional(),
    population: z.coerce.number().int().positive().optional(),
    naicsPriorities: z.string().optional(), // comma-separated
    communityContactName: z.string().max(200).optional(),
    communityContactEmail: z.string().email().optional().or(z.literal("")),
    communityContactUrl: z.string().url().optional().or(z.literal("")),
    active: z.coerce.boolean().optional(),
});

export async function saveCommunity(formData: FormData) {
    const user = await requireSuperuser();

    const parsed = saveCommunitySchema.safeParse({
        id: formData.get("id") || undefined,
        name: formData.get("name"),
        region: formData.get("region") || undefined,
        population: formData.get("population") || undefined,
        naicsPriorities: formData.get("naicsPriorities") || undefined,
        communityContactName: formData.get("communityContactName") || undefined,
        communityContactEmail: formData.get("communityContactEmail") || undefined,
        communityContactUrl: formData.get("communityContactUrl") || undefined,
        active: formData.get("active") ?? true,
    });
    if (!parsed.success) return;

    const naicsPriorities = parsed.data.naicsPriorities
        ? parsed.data.naicsPriorities
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
        : [];

    const values = {
        name: parsed.data.name,
        region: parsed.data.region ?? null,
        population: parsed.data.population ?? null,
        naicsPriorities,
        communityContactName: parsed.data.communityContactName ?? null,
        communityContactEmail: parsed.data.communityContactEmail || null,
        communityContactUrl: parsed.data.communityContactUrl || null,
        active: parsed.data.active ?? true,
    };

    if (parsed.data.id) {
        await db()
            .update(bcpnpSchema.bcpnpCommunity)
            .set(values)
            .where(eq(bcpnpSchema.bcpnpCommunity.id, parsed.data.id));
        await audit({
            actorId: user.id,
            action: "bcpnp_community.update",
            objectType: "bcpnp_community",
            objectId: parsed.data.id,
            meta: { name: parsed.data.name },
        });
    } else {
        await db().insert(bcpnpSchema.bcpnpCommunity).values(values);
        await audit({
            actorId: user.id,
            action: "bcpnp_community.create",
            objectType: "bcpnp_community",
            meta: { name: parsed.data.name },
        });
    }

    revalidatePath("/app/superuser/bcpnp/communities");
}
