import type { UserRole } from "../db/schema";

export const ROLES: readonly UserRole[] = [
    "candidate",
    "consultant",
    "admin",
    "partner",
    "agent",
] as const;

/** Roles that must use TOTP MFA (everyone except candidates). */
export const MFA_ROLES: readonly UserRole[] = ["consultant", "admin", "partner", "agent"];

export const ROLE_HOME: Record<UserRole, string> = {
    candidate: "/app",
    consultant: "/app/consultant",
    admin: "/app/admin",
    partner: "/app/partner",
    agent: "/app/agent",
};

export const ROLE_LABEL: Record<UserRole, string> = {
    candidate: "Candidate",
    consultant: "Consultant",
    admin: "Admin",
    partner: "Partner",
    agent: "Real estate agent",
};

export function requiresMfa(role: UserRole): boolean {
    return MFA_ROLES.includes(role);
}

export function isRole(value: unknown): value is UserRole {
    return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Which role areas a role may open. Admins can open every area; everyone else
 * only their own. Fine-grained object access is checked separately (see
 * ./access.ts) on every request.
 */
export function canEnterArea(role: UserRole, area: UserRole): boolean {
    return role === "admin" || role === area;
}
