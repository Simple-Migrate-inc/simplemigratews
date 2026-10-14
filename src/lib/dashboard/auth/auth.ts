import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink, twoFactor } from "better-auth/plugins";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "../db";
import { env } from "../env";
import { sendEmail } from "../email";

function createAuth() {
    const e = env();
    return betterAuth({
        appName: "Simple Migrate",
        baseURL: e.APP_BASE_URL,
        basePath: "/api/auth",
        secret: e.AUTH_SECRET,
        database: drizzleAdapter(db(), {
            provider: "pg",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
                twoFactor: schema.twoFactor,
            },
        }),
        // Invitation-only: no public sign-up. Accounts are created only by
        // acceptInvitation() (see ./invitations.ts).
        emailAndPassword: {
            enabled: true,
            disableSignUp: true,
            minPasswordLength: 12,
            maxPasswordLength: 128,
        },
        session: {
            expiresIn: 60 * 60 * 12, // 12 hours
            updateAge: 60 * 60, // refresh at most hourly
        },
        user: {
            additionalFields: {
                role: { type: "string", input: false, defaultValue: "candidate" },
                status: { type: "string", input: false, defaultValue: "active" },
                locale: { type: "string", input: false, defaultValue: "en" },
                licenceNumber: { type: "string", input: false, required: false },
                licenceBody: { type: "string", input: false, required: false },
                licenceVerifiedAt: { type: "date", input: false, required: false },
            },
        },
        rateLimit: {
            enabled: true,
            window: 60,
            max: 30,
            customRules: {
                "/sign-in/email": { window: 60, max: e.AUTH_SIGNIN_RATE_LIMIT },
                "/sign-in/magic-link": { window: 60, max: 3 },
                "/two-factor/verify-totp": { window: 60, max: 5 },
            },
        },
        databaseHooks: {
            user: {
                create: {
                    // Defence in depth: refuse to create any user without an
                    // open invitation for that email, whatever the code path.
                    before: async (u) => {
                        const [invite] = await db()
                            .select()
                            .from(schema.invitation)
                            .where(
                                and(
                                    eq(schema.invitation.email, u.email.toLowerCase()),
                                    isNull(schema.invitation.usedAt),
                                    isNull(schema.invitation.revokedAt),
                                    gt(schema.invitation.expiresAt, new Date())
                                )
                            )
                            .limit(1);
                        if (!invite) return false;
                        return { data: { ...u, role: invite.role } };
                    },
                },
            },
            session: {
                create: {
                    // Suspended or deactivated users cannot start a session.
                    before: async (s) => {
                        const [u] = await db()
                            .select({ status: schema.user.status })
                            .from(schema.user)
                            .where(eq(schema.user.id, s.userId))
                            .limit(1);
                        return u?.status === "active";
                    },
                },
            },
        },
        plugins: [
            magicLink({
                disableSignUp: true,
                expiresIn: 60 * 10,
                sendMagicLink: async ({ email, url }) => {
                    await sendEmail({
                        to: email,
                        subject: "Your Simple Migrate sign-in link",
                        text: `Use this link to sign in to your Simple Migrate dashboard. It expires in 10 minutes and can be used once.\n\n${url}\n\nIf you did not request it, you can ignore this email.`,
                    });
                },
            }),
            twoFactor({ issuer: "Simple Migrate" }),
            nextCookies(), // must be last
        ],
    });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { dashAuth?: Auth };

/** Lazily created so importing this module never requires env at build time. */
export function auth(): Auth {
    if (!globalForAuth.dashAuth) globalForAuth.dashAuth = createAuth();
    return globalForAuth.dashAuth;
}
