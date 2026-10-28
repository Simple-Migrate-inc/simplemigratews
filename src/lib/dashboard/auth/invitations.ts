import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "../db";
import { env } from "../env";
import { audit } from "../audit";
import { sendEmail } from "../email";
import type { UserRole } from "../db/schema";
import { auth } from "./auth";
import { REQUIRED_CONSENTS } from "./legal";
import { ROLE_LABEL } from "./roles";

export const INVITE_TTL_DAYS = 7;

export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export async function createInvitation(input: {
    email: string;
    role: UserRole;
    name?: string;
    invitedBy: string;
    cohortId?: string | null;
    partnerId?: string | null;
}): Promise<{ id: string; url: string }> {
    const email = input.email.trim().toLowerCase();
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    // Only one open invitation per email: revoke earlier ones.
    await db()
        .update(schema.invitation)
        .set({ revokedAt: new Date() })
        .where(and(eq(schema.invitation.email, email), isNull(schema.invitation.usedAt), isNull(schema.invitation.revokedAt)));

    const [row] = await db()
        .insert(schema.invitation)
        .values({
            email,
            role: input.role,
            name: input.name ?? null,
            tokenHash: hashToken(token),
            invitedBy: input.invitedBy,
            cohortId: input.cohortId ?? null,
            partnerId: input.partnerId ?? null,
            expiresAt,
        })
        .returning({ id: schema.invitation.id });

    const url = `${env().APP_BASE_URL}/app/invite/${token}`;
    await sendEmail({
        to: email,
        subject: "You're invited to the Simple Migrate dashboard",
        text: `You have been invited to join Simple Migrate as a ${ROLE_LABEL[input.role].toLowerCase()}.\n\nSet up your account here (the link works once and expires in ${INVITE_TTL_DAYS} days):\n${url}`,
    });
    await audit({
        actorId: input.invitedBy,
        action: "invitation.create",
        objectType: "invitation",
        objectId: row.id,
        meta: { role: input.role },
    });
    return { id: row.id, url };
}

/** An invitation that is unused, unrevoked and unexpired — or null. */
export async function findOpenInvitation(token: string) {
    const [row] = await db()
        .select()
        .from(schema.invitation)
        .where(
            and(
                eq(schema.invitation.tokenHash, hashToken(token)),
                isNull(schema.invitation.claimedAt),
                isNull(schema.invitation.usedAt),
                isNull(schema.invitation.revokedAt),
                gt(schema.invitation.expiresAt, new Date())
            )
        )
        .limit(1);
    return row ?? null;
}

export class InvitationError extends Error {}

/**
 * Create the account for an open invitation, record the exact consent
 * wording accepted, and set up role-specific records. Single use.
 */
export async function acceptInvitation(input: {
    token: string;
    name: string;
    password: string;
    ip: string | null;
    userAgent: string | null;
}): Promise<{ userId: string; email: string }> {
    const invite = await findOpenInvitation(input.token);
    if (!invite) throw new InvitationError("This invitation link is invalid, used or expired.");

    // Claim atomically so the link cannot be used twice in parallel.
    const claimed = await db()
        .update(schema.invitation)
        .set({ claimedAt: new Date() })
        .where(and(eq(schema.invitation.id, invite.id), isNull(schema.invitation.claimedAt)))
        .returning({ id: schema.invitation.id });
    if (claimed.length === 0) throw new InvitationError("This invitation has already been used.");

    const ctx = await auth().$context;
    const existing = await ctx.internalAdapter.findUserByEmail(invite.email);
    if (existing) throw new InvitationError("An account already exists for this email. Please sign in.");

    // The user-create hook independently re-checks for an open invitation.
    const created = await ctx.internalAdapter.createUser({
        email: invite.email,
        name: input.name,
        emailVerified: true,
        role: invite.role,
    }, { method: "invitation" });
    if (!created) throw new InvitationError("Could not create the account.");

    await ctx.internalAdapter.linkAccount({
        userId: created.id,
        providerId: "credential",
        accountId: created.id,
        password: await ctx.password.hash(input.password),
    });

    await db()
        .insert(schema.consentRecord)
        .values(
            REQUIRED_CONSENTS.map((c) => ({
                userId: created.id,
                kind: c.kind,
                version: c.version,
                wording: c.wording,
                ipAddress: input.ip,
                userAgent: input.userAgent,
            }))
        );

    if (invite.role === "candidate") {
        await db().insert(schema.dashCase).values({
            candidateId: created.id,
            cohortId: invite.cohortId,
            stage: "invited",
        });
    }
    if (invite.role === "partner" && invite.partnerId) {
        await db().insert(schema.partnerMember).values({ partnerId: invite.partnerId, userId: created.id });
    }

    await db().update(schema.invitation).set({ usedAt: new Date() }).where(eq(schema.invitation.id, invite.id));
    await audit({
        actorId: created.id,
        action: "invitation.accept",
        objectType: "invitation",
        objectId: invite.id,
    });
    return { userId: created.id, email: invite.email };
}
