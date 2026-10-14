import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Scope: dashboard routes only (see matcher). Public pages are untouched.
// This is a fast cookie-presence check; real authorization happens on the
// server for every page and action (lib/dashboard/auth/session.ts).

const PUBLIC_DASHBOARD_PATHS = ["/app/login", "/app/invite/"];

export function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const isPublic = PUBLIC_DASHBOARD_PATHS.some((p) => pathname.startsWith(p));

    if (!isPublic && !getSessionCookie(req)) {
        const url = req.nextUrl.clone();
        url.pathname = "/app/login";
        url.search = "";
        if (pathname !== "/app") url.searchParams.set("next", pathname + search);
        return NextResponse.redirect(url);
    }

    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "same-origin");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return res;
}

export const config = {
    matcher: ["/app", "/app/:path*"],
};
