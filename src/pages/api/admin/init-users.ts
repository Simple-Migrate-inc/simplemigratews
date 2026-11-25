/**
 * ONE-TIME bootstrap endpoint — DELETE THIS FILE after first use.
 * POST /api/admin/init-users
 * Header: x-init-token: <INIT_USERS_TOKEN env var>
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db, schema as s } from "@dashboard/db";
import { REQUIRED_CONSENTS } from "../../../lib/dashboard/auth/legal";

const TOKEN = process.env.INIT_USERS_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();
    if (!TOKEN || req.headers["x-init-token"] !== TOKEN) return res.status(401).json({ error: "Unauthorized" });

    const USERS = [
        { name: "Sonia Nanda",     email: "globalbusinessbrokeroffice@gmail.com" },
        { name: "Shahrukh Naseer", email: "snaseer@nciscanada.ca" },
    ];
    const hash = await hashPassword("SimpleMigrate2026!");
    const created: string[] = [];
    const skipped: string[] = [];

    for (const u of USERS) {
        const existing = await db()
            .select({ id: s.user.id })
            .from(s.user)
            .where(eq(s.user.email, u.email))
            .limit(1);

        if (existing.length) { skipped.push(u.email); continue; }

        const userId = randomUUID();
        await db().insert(s.user).values({ id: userId, name: u.name, email: u.email, role: "superuser", emailVerified: true });
        await db().insert(s.account).values({ id: randomUUID(), userId, accountId: userId, providerId: "credential", password: hash });
        await db().insert(s.consentRecord).values(
            REQUIRED_CONSENTS.map((c) => ({ userId, kind: c.kind, version: c.version, wording: c.wording }))
        );
        created.push(u.email);
    }

    return res.status(200).json({ created, skipped });
}
