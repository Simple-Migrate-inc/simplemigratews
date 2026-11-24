import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { db } from "@dashboard/db";
import { gpSchema } from "@dashboard/db";
import { computeAutoScore } from "../../../lib/partners/auto-score";
import { makeCrmAdapter } from "../../../lib/integrations/crm-adapter";
import { makeNotifyAdapter } from "../../../lib/integrations/notify-adapter";

// ─── Rate limit (in-memory per IP) ───────────────────────────────────────────

const RL_MAX = 3;
const RL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const rlStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rlStore.get(ip);
    if (!entry || now > entry.resetAt) {
        rlStore.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
        return false;
    }
    if (entry.count >= RL_MAX) return true;
    entry.count++;
    return false;
}

// ─── Validation schema ────────────────────────────────────────────────────────

const bodySchema = z.object({
    contactName:          z.string().min(2).max(200),
    email:                z.string().email().max(320),
    phone:                z.string().min(5).max(50),
    company:              z.string().min(1).max(300),
    website:              z.string().url().optional().or(z.literal("")),
    country:              z.string().min(2).max(100),
    city:                 z.string().min(1).max(100),
    type:                 z.enum(["marketing", "professional", "licensed_immigration", "strategic", "ambassador"], { errorMap: () => ({ message: "Please select a partner type." }) }),
    segments:             z.array(z.string().max(100)).max(20).default([]),
    estReferralsPerQtr:   z.coerce.number().int().min(0).max(1000).default(0),
    licenceNo:            z.string().max(100).optional().or(z.literal("")),
    heardFrom:            z.string().max(200).optional().or(z.literal("")),
    caslMarketingConsent: z.boolean().default(false),
    conductAccepted:      z.boolean(),
    privacyAccepted:      z.boolean(),
    utm:                  z.record(z.string(), z.string()).optional(),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Honeypot — if the hidden field has a value, silently accept (bot)
    const body = req.body as Record<string, unknown>;
    if (body.website_confirm) {
        return res.status(200).json({ ok: true });
    }

    const ip =
        (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

    if (isRateLimited(ip)) {
        return res.status(429).json({ error: "Too many applications from this address. Please try again tomorrow." });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        const flat = parsed.error.flatten();
        const firstField = Object.entries(flat.fieldErrors)[0];
        const friendlyMsg = firstField
            ? `Invalid field "${firstField[0]}": ${firstField[1]?.[0]}`
            : "Invalid form data";
        return res.status(400).json({ error: friendlyMsg, details: flat });
    }

    const data = parsed.data;

    if (!data.conductAccepted || !data.privacyAccepted) {
        return res.status(400).json({ error: "Please accept the Code of Conduct and Privacy Policy." });
    }

    const autoScore = computeAutoScore({
        country:              data.country,
        type:                 data.type,
        segments:             data.segments,
        est_referrals_per_qtr: data.estReferralsPerQtr,
        licence_no:           data.licenceNo || null,
    });

    const [row] = await db()
        .insert(gpSchema.gpApplication)
        .values({
            contactName:          data.contactName,
            email:                data.email,
            phone:                data.phone,
            company:              data.company,
            website:              data.website || null,
            country:              data.country,
            city:                 data.city,
            type:                 data.type,
            segments:             data.segments,
            estReferralsPerQtr:   data.estReferralsPerQtr,
            licenceNo:            data.licenceNo || null,
            heardFrom:            data.heardFrom || null,
            caslMarketingConsent: data.caslMarketingConsent,
            conductAcceptedAt:    data.conductAccepted ? new Date() : null,
            privacyAcceptedAt:    data.privacyAccepted ? new Date() : null,
            utm:                  data.utm ?? null,
            autoScore,
            status:               "applied",
        })
        .returning({ id: gpSchema.gpApplication.id });

    // Fire-and-forget side effects
    const notify = makeNotifyAdapter();
    const crm    = makeCrmAdapter();

    void notify.send({
        event:          "partner.application_received",
        recipientEmail: data.email,
        recipientName:  data.contactName,
        data:           { applicationId: row.id, company: data.company, autoScore },
    });

    void crm.pushContact({
        name:    data.contactName,
        email:   data.email,
        phone:   data.phone,
        company: data.company,
        country: data.country,
        source:  "partner_application",
        meta:    { applicationId: row.id, type: data.type, autoScore },
    });

    return res.status(200).json({ ok: true, applicationId: row.id });
}
