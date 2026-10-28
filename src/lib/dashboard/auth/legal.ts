/**
 * Consent wording captured at onboarding. The exact text and version are
 * stored with each acceptance, so changing wording means adding a new
 * version — users are then asked to accept it on their next visit.
 *
 * DRAFT wording for the pilot: must be reviewed by counsel before launch.
 */
export type ConsentDefinition = {
    kind: "terms" | "privacy" | "data_processing";
    version: string;
    label: string;
    wording: string;
    link?: string;
};

export const REQUIRED_CONSENTS: readonly ConsentDefinition[] = [
    {
        kind: "terms",
        version: "2026-10-14-draft",
        label: "Terms of service",
        link: "/terms-of-service",
        wording:
            "I agree to the Simple Migrate Terms of Service. I understand Simple Migrate organizes my information and introduces me to licensed professionals; it does not decide or guarantee eligibility, nomination, permanent residence, financing or business success.",
    },
    {
        kind: "privacy",
        version: "2026-10-14-draft",
        label: "Privacy policy",
        link: "/privacy-policy",
        wording:
            "I have read the Simple Migrate Privacy Policy and understand how my personal information is collected, stored and used.",
    },
    {
        kind: "data_processing",
        version: "2026-10-14-draft",
        label: "Sharing and AI processing",
        wording:
            "I understand that my file is shared with a partner or real estate agent only after I approve a specific, time-limited share, and that I can revoke it at any time. I understand that AI tools may help organize my file under the supervision of a licensed professional, and that my documents are never used to train AI models.",
    },
];
