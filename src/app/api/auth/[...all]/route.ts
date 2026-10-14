import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@dashboard/auth/auth";

export const dynamic = "force-dynamic";

// Built lazily so `next build` never needs dashboard env vars.
const handler = () => toNextJsHandler(auth());

export const GET = (req: Request) => handler().GET(req);

export const POST = (req: Request) => {
    // Accounts are created only through invitations — never via the API.
    if (new URL(req.url).pathname.startsWith("/api/auth/sign-up")) {
        return new Response("Not found", { status: 404 });
    }
    return handler().POST(req);
};
