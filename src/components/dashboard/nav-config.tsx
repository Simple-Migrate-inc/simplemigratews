// .tsx on purpose: Tailwind and PurgeCSS only scan *.tsx, so class names
// (including icon classes) must live in .tsx files to survive the build.
import type { UserRole } from "@dashboard/db/schema";

export type NavItem = { href: string; label: string; icon: string; exact?: boolean };

/** Only pages that exist are listed; later phases add items here. */
export const NAV: Record<UserRole, NavItem[]> = {
    candidate: [
        { href: "/app", label: "Home", icon: "fa-home", exact: true },
        { href: "/app/account", label: "Account", icon: "fa-user-circle" },
    ],
    consultant: [
        { href: "/app/consultant", label: "Caseload", icon: "fa-folder-open", exact: true },
        { href: "/app/account", label: "Account", icon: "fa-user-circle" },
    ],
    admin: [
        { href: "/app/admin", label: "Overview", icon: "fa-chart-bar", exact: true },
        { href: "/app/admin/users", label: "Users & invites", icon: "fa-users" },
        { href: "/app/account", label: "Account", icon: "fa-user-circle" },
    ],
    partner: [
        { href: "/app/partner", label: "Referrals", icon: "fa-inbox", exact: true },
        { href: "/app/account", label: "Account", icon: "fa-user-circle" },
    ],
    agent: [
        { href: "/app/agent", label: "Home", icon: "fa-home", exact: true },
        { href: "/app/account", label: "Account", icon: "fa-user-circle" },
    ],
};
