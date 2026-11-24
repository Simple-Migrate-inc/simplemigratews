import type { UserRole } from "../db/schema";

export const ROLES: readonly UserRole[] = [
    "candidate",
    "consultant",
    "admin",
    "partner_manager",
    "partner",
    "agent",
    "superuser",
] as const;

/** Roles that must use TOTP MFA (everyone except candidates). */
export const MFA_ROLES: readonly UserRole[] = [
    "consultant",
    "admin",
    "partner_manager",
    "partner",
    "agent",
    "superuser",
];

export const ROLE_HOME: Record<UserRole, string> = {
    candidate: "/app",
    consultant: "/app/consultant",
    admin: "/app/admin",
    partner_manager: "/app/admin/partners",
    partner: "/app/partner",
    agent: "/app/agent",
    superuser: "/app/superuser",
};

export const ROLE_LABEL: Record<UserRole, string> = {
    candidate: "Candidate",
    consultant: "Consultant",
    admin: "Admin",
    partner_manager: "Partner Manager",
    partner: "Partner",
    agent: "Real estate agent",
    superuser: "Superuser",
};

export function requiresMfa(role: UserRole): boolean {
    return MFA_ROLES.includes(role);
}

export function isRole(value: unknown): value is UserRole {
    return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Which role areas a role may open. Admins, superusers and partner_managers
 * can open the admin area; everyone else only their own.
 */
export function canEnterArea(role: UserRole, area: UserRole): boolean {
    if (role === "admin" || role === "superuser") return true;
    if (role === "partner_manager" && area === "admin") return true;
    return role === area;
}
