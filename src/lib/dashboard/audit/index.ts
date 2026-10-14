import "server-only";
import { headers } from "next/headers";
import { db, schema } from "../db";

export type AuditInput = {
    actorId: string | null;
    action: string; // e.g. "case.view", "document.download", "invite.create"
    objectType: string;
    objectId?: string | null;
    caseId?: string | null;
    meta?: Record<string, unknown>;
};

function requestContext(): { ip: string | null; userAgent: string | null } {
    try {
        const h = headers();
        const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
        return { ip: ip || null, userAgent: h.get("user-agent") };
    } catch {
        // Outside a request (scripts, cron) there are no headers.
        return { ip: null, userAgent: null };
    }
}

/**
 * Record a read or write of candidate data. Append-only: there is no update
 * or delete helper, and the table rejects both at the database level.
 */
export async function audit(input: AuditInput): Promise<void> {
    const ctx = requestContext();
    await db()
        .insert(schema.auditEvent)
        .values({
            actorId: input.actorId,
            action: input.action,
            objectType: input.objectType,
            objectId: input.objectId ?? null,
            caseId: input.caseId ?? null,
            meta: input.meta ?? null,
            ip: ctx.ip,
            userAgent: ctx.userAgent,
        });
}
