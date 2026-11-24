/**
 * Global Partner Program — database tables.
 *
 * All tables live in the existing `dashboard` Postgres schema and are prefixed
 * `gp_` to stay visually distinct from core dashboard and BC PNP tables.
 * Rules: additive only, never drop/rename shipped columns. Money is always
 * integer minor units + ISO currency text — never float or numeric.
 */
import { sql } from "drizzle-orm";
import {
    boolean,
    bigint,
    index,
    integer,
    jsonb,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { dashboard, user } from "./schema";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () =>
    ts("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date());
const id = () => uuid("id").primaryKey().defaultRandom();

// ─── Enums ───────────────────────────────────────────────────────────────────

export const gpOrgType = dashboard.enum("gp_org_type", [
    "marketing",
    "professional",
    "licensed_immigration",
    "strategic",
    "ambassador",
]);

export const gpOrgStatus = dashboard.enum("gp_org_status", [
    "pending",
    "active",
    "suspended",
    "archived",
]);

export const gpApplicationStatus = dashboard.enum("gp_application_status", [
    "applied",
    "screening",
    "meeting_scheduled",
    "due_diligence",
    "approved",
    "waitlisted",
    "declined",
]);

export const gpMemberRole = dashboard.enum("gp_member_role", [
    "org_admin",
    "member",
]);

export const gpTier = dashboard.enum("gp_tier", [
    "registered",
    "silver",
    "gold",
    "platinum",
]);

export const gpCollabType = dashboard.enum("gp_collab_type", [
    "join_client_file",
    "introduce_specialist",
    "document_needed",
    "co_marketing",
    "deal_opportunity",
    "attribution_dispute",
]);

// ─── Exported types ───────────────────────────────────────────────────────────

export type GpOrgType = (typeof gpOrgType.enumValues)[number];
export type GpApplicationStatus = (typeof gpApplicationStatus.enumValues)[number];
export type GpTier = (typeof gpTier.enumValues)[number];
export type GpMemberRole = (typeof gpMemberRole.enumValues)[number];

// ─── Tables ───────────────────────────────────────────────────────────────────

/** Incoming partner applications — public /partners/apply form submissions. */
export const gpApplication = dashboard.table("gp_application", {
    id: id(),
    contactName: text("contact_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    company: text("company").notNull(),
    website: text("website"),
    socials: jsonb("socials"),
    country: text("country").notNull(),
    city: text("city").notNull(),
    type: gpOrgType("type").notNull(),
    segments: text("segments").array().notNull().default(sql`'{}'::text[]`),
    estReferralsPerQtr: integer("est_referrals_per_qtr").notNull().default(0),
    licenceNo: text("licence_no"),
    heardFrom: text("heard_from"),
    utm: jsonb("utm"),
    autoScore: integer("auto_score").notNull().default(0),
    status: gpApplicationStatus("status").notNull().default("applied"),
    declineReasonCode: text("decline_reason_code"),
    meetingAt: ts("meeting_at"),
    reviewedBy: text("reviewed_by").references(() => user.id),
    conductAcceptedAt: ts("conduct_accepted_at"),
    privacyAcceptedAt: ts("privacy_accepted_at"),
    caslMarketingConsent: boolean("casl_marketing_consent").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** An approved partner organisation. Created when an application is approved. */
export const gpOrg = dashboard.table("gp_org", {
    id: id(),
    name: text("name").notNull(),
    type: gpOrgType("type").notNull(),
    status: gpOrgStatus("status").notNull().default("pending"),
    tier: gpTier("tier").notNull().default("registered"),
    applicationId: uuid("application_id").references(() => gpApplication.id),
    managerUserId: text("manager_user_id").references(() => user.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** Users who belong to a partner org. */
export const gpMember = dashboard.table(
    "gp_member",
    {
        id: id(),
        orgId: uuid("org_id")
            .notNull()
            .references(() => gpOrg.id),
        userId: text("user_id")
            .notNull()
            .references(() => user.id),
        role: gpMemberRole("role").notNull().default("member"),
        active: boolean("active").notNull().default(true),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [uniqueIndex("gp_member_uq").on(t.orgId, t.userId)]
);

/** Regulatory flags per org that gate commission eligibility. */
export const gpPartnerArrangement = dashboard.table("gp_partner_arrangement", {
    id: id(),
    orgId: uuid("org_id")
        .notNull()
        .unique()
        .references(() => gpOrg.id),
    regulatorPermitsReferralFee: boolean("regulator_permits_referral_fee").notNull().default(false),
    ciccAgentRegistrationVerifiedAt: ts("cicc_agent_registration_verified_at"),
    verifiedBy: text("verified_by").references(() => user.id),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** KYC record per partner org. */
export const gpKyc = dashboard.table("gp_kyc", {
    id: id(),
    orgId: uuid("org_id")
        .notNull()
        .unique()
        .references(() => gpOrg.id),
    principalIdVerifiedAt: ts("principal_id_verified_at"),
    businessRegNo: text("business_reg_no"),
    beneficialOwners: jsonb("beneficial_owners"),
    sanctionsCheckedAt: ts("sanctions_checked_at"),
    sanctionsResult: text("sanctions_result"),
    adverseMediaResult: text("adverse_media_result"),
    taxProfile: jsonb("tax_profile"),
    riskRating: text("risk_rating"),
    nextReviewAt: ts("next_review_at"),
    reviewedBy: text("reviewed_by").references(() => user.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** Signed partner agreement (CoC + DPA). */
export const gpAgreement = dashboard.table("gp_agreement", {
    id: id(),
    orgId: uuid("org_id")
        .notNull()
        .references(() => gpOrg.id),
    agreementVersion: text("agreement_version").notNull(),
    codeOfConductVersion: text("code_of_conduct_version").notNull(),
    dpaVersion: text("dpa_version").notNull(),
    signedAt: ts("signed_at"),
    signerUserId: text("signer_user_id").references(() => user.id),
    esignProviderRef: text("esign_provider_ref"),
    docBlobKey: text("doc_blob_key"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** Immutable log of tier changes per org. */
export const gpTierHistory = dashboard.table("gp_tier_history", {
    id: id(),
    orgId: uuid("org_id")
        .notNull()
        .references(() => gpOrg.id),
    tier: gpTier("tier").notNull(),
    effectiveFrom: ts("effective_from").notNull(),
    reason: text("reason").notNull().default("auto"),
    metricsSnapshot: jsonb("metrics_snapshot"),
    actorId: text("actor_id").references(() => user.id),
    createdAt: createdAt(),
});

/** Superuser-editable tier thresholds and commission rates. Never hardcoded. */
export const gpTierRule = dashboard.table("gp_tier_rule", {
    id: id(),
    tier: gpTier("tier").notNull().unique(),
    minPaidClients: integer("min_paid_clients").notNull().default(0),
    minSourcedRevenueMinor: bigint("min_sourced_revenue_minor", { mode: "number" }).notNull().default(0),
    currency: text("currency").notNull().default("CAD"),
    rateBps: integer("rate_bps").notNull(),
    perks: jsonb("perks"),
    active: boolean("active").notNull().default(true),
    updatedAt: updatedAt(),
});

/** What Simple Migrate services are commissionable. */
export const gpServiceCode = dashboard.table("gp_service_code", {
    id: id(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    commissionable: boolean("commissionable").notNull().default(true),
    category: text("category").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/**
 * Commission rate overrides. Most-specific-match wins:
 * org+service > org > tier+service > tier > (default = tier rule rate_bps).
 */
export const gpCommissionRule = dashboard.table("gp_commission_rule", {
    id: id(),
    orgId: uuid("org_id").references(() => gpOrg.id),
    serviceCode: text("service_code"),
    tier: gpTier("tier"),
    rateBps: integer("rate_bps").notNull(),
    effectiveFrom: ts("effective_from").notNull(),
    effectiveTo: ts("effective_to"),
    createdAt: createdAt(),
});

/** Partner-facing stage definitions. Partner labels are what partners see. */
export const gpStageDefinition = dashboard.table("gp_stage_definition", {
    id: id(),
    stageKey: text("stage_key").notNull().unique(),
    internalLabel: text("internal_label").notNull(),
    partnerLabel: text("partner_label").notNull(),
    sortOrder: integer("sort_order").notNull(),
    isCommissionEvent: boolean("is_commission_event").notNull().default(false),
    createdAt: createdAt(),
});

/** Stage events per client — this is the only data partners can see about a client. */
export const gpClientStage = dashboard.table(
    "gp_client_stage",
    {
        id: id(),
        clientUserId: text("client_user_id")
            .notNull()
            .references(() => user.id),
        stageKey: text("stage_key").notNull(),
        occurredAt: ts("occurred_at").notNull(),
        actorId: text("actor_id").references(() => user.id),
        source: text("source").notNull().default("system"),
        createdAt: createdAt(),
    },
    (t) => [index("gp_client_stage_user_idx").on(t.clientUserId)]
);
