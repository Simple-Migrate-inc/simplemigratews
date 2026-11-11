/**
 * BC PNP Entrepreneur Immigration — database tables.
 *
 * All tables live in the existing `dashboard` Postgres schema and are prefixed
 * `bcpnp_` to stay visually distinct from Readiness Dashboard tables.
 * Rules: additive only, never drop/rename shipped columns.
 */
import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
    boolean,
    date,
    index,
    integer,
    jsonb,
    numeric,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { dashboard, user, partner } from "./schema";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () =>
    ts("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date());
const id = () => uuid("id").primaryKey().defaultRandom();

// ─── BC PNP Enums ─────────────────────────────────────────────────────────────

export const bcpnpStream = dashboard.enum("bcpnp_stream", ["base", "regional"]);

export const bcpnpCaseStatus = dashboard.enum("bcpnp_case_status", [
    "active",
    "withdrawn",
    "closed",
    "nominated",
]);

export const bcpnpCaseStage = dashboard.enum("bcpnp_case_stage", [
    "intake_eligibility",
    "business_concept",
    "exploratory_visit",
    "registration",
    "qualified_pool",
    "application",
    "interview_performance",
    "work_permit_arrival",
    "business_establishment",
    "final_report_nomination",
]);

export const bcpnpDeadlineStatus = dashboard.enum("bcpnp_deadline_status", [
    "pending",
    "due_soon",
    "overdue",
    "completed",
    "waived",
]);

export const bcpnpDocCategory = dashboard.enum("bcpnp_doc_category", [
    "identity",
    "financial",
    "business",
    "immigration",
    "legal",
    "other",
]);

export const bcpnpInvCategory = dashboard.enum("bcpnp_inv_category", [
    "equipment",
    "leasehold",
    "marketing",
    "operating",
    "inventory",
    "vehicle",
    "purchase_price",
    "other",
]);

export const bcpnpPartnerType = dashboard.enum("bcpnp_partner_type", [
    "immigration_representative",
    "accounting_firm",
    "cpa",
    "realtor",
    "business_broker",
    "financing_partner",
    "business_services",
    "community_contact",
]);

export const bcpnpJobStatus = dashboard.enum("bcpnp_job_status", [
    "planned",
    "hired",
    "active",
    "terminated",
]);

// ─── Rule library ──────────────────────────────────────────────────────────────

/** Named guide edition. Cases are pinned to the edition in force at registration. */
export const bcpnpGuideEdition = dashboard.table("bcpnp_guide_edition", {
    id: id(),
    code: text("code").notNull().unique(), // "2024-05-27"
    label: text("label").notNull(),
    effectiveFrom: ts("effective_from").notNull(),
    effectiveUntil: ts("effective_until"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/**
 * Individual versioned rules: stream + edition + key → value.
 * null stream = rule applies to both streams.
 * All rule values from the May 27, 2024 guide are seeded with verified = false.
 */
export const bcpnpRule = dashboard.table(
    "bcpnp_rule",
    {
        id: id(),
        editionId: uuid("edition_id")
            .notNull()
            .references(() => bcpnpGuideEdition.id),
        stream: bcpnpStream("stream"), // null = both
        key: text("key").notNull(),
        valueNum: numeric("value_num", { precision: 15, scale: 4 }),
        valueText: text("value_text"),
        valueJson: jsonb("value_json"),
        unit: text("unit"), // cad | months | days | percentage | count
        description: text("description").notNull(),
        sourceRef: text("source_ref"),
        verified: boolean("verified").notNull().default(false),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        uniqueIndex("bcpnp_rule_edition_stream_key_uq").on(t.editionId, t.stream, t.key),
        index("bcpnp_rule_edition_idx").on(t.editionId),
    ]
);

// ─── Communities (Regional stream) ────────────────────────────────────────────

/** Enrolled BC communities for the Regional stream. Admin-editable. */
export const bcpnpCommunity = dashboard.table("bcpnp_community", {
    id: id(),
    name: text("name").notNull(),
    region: text("region"),
    population: integer("population"),
    naicsPriorities: text("naics_priorities")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    communityContactName: text("community_contact_name"),
    communityContactEmail: text("community_contact_email"),
    communityContactUrl: text("community_contact_url"),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

// ─── Cases ─────────────────────────────────────────────────────────────────────

export const bcpnpCase = dashboard.table(
    "bcpnp_case",
    {
        id: id(),
        applicantId: text("applicant_id")
            .notNull()
            .references(() => user.id),
        superuserId: text("superuser_id").references(() => user.id),
        consultantId: text("consultant_id").references(() => user.id),
        guideEditionId: uuid("guide_edition_id").references(() => bcpnpGuideEdition.id),
        stream: bcpnpStream("stream"),
        stage: bcpnpCaseStage("stage").notNull().default("intake_eligibility"),
        status: bcpnpCaseStatus("status").notNull().default("active"),
        displayTz: text("display_tz").notNull().default("America/Vancouver"),
        communityId: uuid("community_id").references(() => bcpnpCommunity.id),
        // Self-reference for Base co-registrant: set on the second applicant's case.
        coRegistrantCaseId: uuid("co_registrant_case_id").references(
            (): AnyPgColumn => bcpnpCase.id
        ),
        coRegistrantWindowExpiresAt: ts("co_registrant_window_expires_at"),
        notes: text("notes"),
        openedAt: ts("opened_at").notNull().defaultNow(),
        closedAt: ts("closed_at"),
        closeReason: text("close_reason"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index("bcpnp_case_applicant_idx").on(t.applicantId),
        index("bcpnp_case_superuser_idx").on(t.superuserId),
        index("bcpnp_case_stage_status_idx").on(t.stage, t.status),
    ]
);

export const bcpnpFamilyMember = dashboard.table(
    "bcpnp_family_member",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => bcpnpCase.id),
        relationship: text("relationship").notNull(), // spouse | dependent_child | other
        name: text("name").notNull(),
        dob: date("dob"),
        citizenship: text("citizenship"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("bcpnp_family_member_case_idx").on(t.caseId)]
);

/**
 * Applicant's self-declared profile data used by the eligibility screener and
 * score estimator. One row per case, updated in-place.
 */
export const bcpnpApplicantProfile = dashboard.table("bcpnp_applicant_profile", {
    id: id(),
    caseId: uuid("case_id")
        .notNull()
        .references(() => bcpnpCase.id)
        .unique(),
    // Financials
    netWorthCadCents: integer("net_worth_cad_cents"),
    proposedInvestmentCadCents: integer("proposed_investment_cad_cents"),
    proposedOwnershipPct: numeric("proposed_ownership_pct", { precision: 5, scale: 2 }),
    equityInvestmentCadCents: integer("equity_investment_cad_cents"), // for <33.33% base threshold
    // Experience
    ownerManagerMonths: integer("owner_manager_months"),
    seniorManagerMonths: integer("senior_manager_months"),
    ownerManagerPct: numeric("owner_manager_pct", { precision: 5, scale: 2 }), // ownership % held during owner-manager role
    seniorManagerDirectReports: integer("senior_manager_direct_reports"),
    // Education
    hasPostSecondary: boolean("has_post_secondary"),
    selfEmployedMonthsLast60: integer("self_employed_months_last_60"), // months running 100%-owned biz in last 60 months
    // Language
    languageTestType: text("language_test_type"), // ielts | celpip | tef
    languageScores: jsonb("language_scores"), // {listening, reading, writing, speaking}
    // For Regional
    hasExploratoryVisit: boolean("has_exploratory_visit"),
    hasCommunityReferral: boolean("has_community_referral"),
    // Business
    businessType: text("business_type"), // new | purchase | franchise_new_location
    currentOwnerOperatedMonths: integer("current_owner_operated_months"),
    // Residence
    residenceWithinKm: boolean("residence_within_km"),
    noLongFerry: boolean("no_long_ferry"),
    residenceInsideCommunity: boolean("residence_inside_community"), // Regional
    completedAt: ts("completed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

// ─── Business concept ─────────────────────────────────────────────────────────

/**
 * Versioned business concept. Edits create a new version row; locking seals
 * the concept and all later documents are diffed against the locked version.
 */
export const bcpnpBusinessConcept = dashboard.table(
    "bcpnp_business_concept",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => bcpnpCase.id),
        version: integer("version").notNull(),
        naicsCode: text("naics_code"),
        naicsDescription: text("naics_description"),
        businessType: text("business_type"), // new | purchase | franchise_new_location
        businessName: text("business_name"),
        businessLocation: text("business_location"),
        // Purchase-specific
        currentOwnerOperatedMonths: integer("current_owner_operated_months"),
        isGoingConcern: boolean("is_going_concern"),
        numExistingJobsToMaintain: integer("num_existing_jobs_to_maintain"),
        purchasePriceCadCents: integer("purchase_price_cad_cents"),
        // Ownership
        ownershipPct: numeric("ownership_pct", { precision: 5, scale: 2 }),
        equityInvestmentCadCents: integer("equity_investment_cad_cents"),
        // Checks (computed server-side, stored for display)
        ineligibleFlag: text("ineligible_flag"), // reason if hard-blocked
        regulatedSectorFlag: text("regulated_sector_flag"), // reason if flagged
        // Lock
        lockedAt: ts("locked_at"),
        lockedBy: text("locked_by").references(() => user.id),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        uniqueIndex("bcpnp_business_concept_case_version_uq").on(t.caseId, t.version),
        index("bcpnp_business_concept_case_idx").on(t.caseId),
    ]
);

export const bcpnpInvestmentLine = dashboard.table(
    "bcpnp_investment_line",
    {
        id: id(),
        conceptId: uuid("concept_id")
            .notNull()
            .references(() => bcpnpBusinessConcept.id),
        description: text("description").notNull(),
        category: bcpnpInvCategory("category").notNull(),
        amountCadCents: integer("amount_cad_cents").notNull(),
        capAppliedCadCents: integer("cap_applied_cad_cents"),
        eligibleCadCents: integer("eligible_cad_cents").notNull().default(0),
        capReason: text("cap_reason"),
        // Pre-ITA or external financing = $0 eligible
        preIta: boolean("pre_ita").notNull().default(false),
        externalFinancing: boolean("external_financing").notNull().default(false),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("bcpnp_investment_line_concept_idx").on(t.conceptId)]
);

export const bcpnpJobPlan = dashboard.table(
    "bcpnp_job_plan",
    {
        id: id(),
        conceptId: uuid("concept_id")
            .notNull()
            .references(() => bcpnpBusinessConcept.id),
        jobTitle: text("job_title").notNull(),
        hoursPerWeek: integer("hours_per_week").notNull(),
        annualHours: integer("annual_hours").notNull(),
        startDate: date("start_date"),
        isOnSite: boolean("is_on_site").notNull().default(true),
        isDirectEmployee: boolean("is_direct_employee").notNull().default(true),
        shareholderPct: numeric("shareholder_pct", { precision: 5, scale: 2 }),
        status: bcpnpJobStatus("status").notNull().default("planned"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("bcpnp_job_plan_concept_idx").on(t.conceptId)]
);

// ─── Score ────────────────────────────────────────────────────────────────────

/** Self-declared score sections + reviewer-entered concept score range. */
export const bcpnpScore = dashboard.table(
    "bcpnp_score",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => bcpnpCase.id),
        // Self-declared sections
        experiencePoints: integer("experience_points"),
        netWorthPoints: integer("net_worth_points"),
        investmentPoints: integer("investment_points"),
        jobsPoints: integer("jobs_points"),
        regionPoints: integer("region_points"),
        adaptabilityPoints: integer("adaptability_points"),
        communityPopulationPoints: integer("community_population_points"), // Regional only
        selfDeclaredTotal: integer("self_declared_total"),
        // Concept score (reviewer-entered range)
        conceptScoreMin: integer("concept_score_min"),
        conceptScoreMax: integer("concept_score_max"),
        conceptScoreActual: integer("concept_score_actual"), // set after review
        // Pool entry
        meetsPoolMinimum: boolean("meets_pool_minimum"),
        computedAt: ts("computed_at").notNull().defaultNow(),
        computedBy: text("computed_by").references(() => user.id),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("bcpnp_score_case_idx").on(t.caseId)]
);

// ─── Documents ────────────────────────────────────────────────────────────────

export const bcpnpDocument = dashboard.table(
    "bcpnp_document",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => bcpnpCase.id),
        category: bcpnpDocCategory("category").notNull(),
        docType: text("doc_type").notNull(), // e.g. "passport", "bank_statement"
        label: text("label").notNull(),
        storageKey: text("storage_key"),
        filename: text("filename"),
        mime: text("mime"),
        sizeBytes: integer("size_bytes"),
        version: integer("version").notNull().default(1),
        expiryDate: date("expiry_date"),
        translationStatus: text("translation_status"), // not_required | required | submitted | accepted
        scanStatus: text("scan_status").notNull().default("pending"),
        deletedAt: ts("deleted_at"), // soft delete
        uploadedBy: text("uploaded_by").references(() => user.id),
        acceptedBy: text("accepted_by").references(() => user.id),
        acceptedAt: ts("accepted_at"),
        notes: text("notes"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index("bcpnp_document_case_idx").on(t.caseId),
        index("bcpnp_document_case_category_idx").on(t.caseId, t.category),
    ]
);

export const bcpnpDocumentShare = dashboard.table(
    "bcpnp_document_share",
    {
        id: id(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => bcpnpDocument.id),
        sharedWithUserId: text("shared_with_user_id").references(() => user.id),
        sharedWithPartnerId: uuid("shared_with_partner_id").references(() => partner.id),
        purpose: text("purpose").notNull(),
        consentNote: text("consent_note"),
        sharedBy: text("shared_by")
            .notNull()
            .references(() => user.id),
        revokedAt: ts("revoked_at"),
        expiresAt: ts("expires_at"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("bcpnp_document_share_document_idx").on(t.documentId)]
);

// ─── Deadline engine ──────────────────────────────────────────────────────────

/**
 * Anchor events that trigger deadline calculation.
 * One row per event key per case; updated in-place when the event is confirmed.
 */
export const bcpnpCaseEvent = dashboard.table(
    "bcpnp_case_event",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => bcpnpCase.id),
        eventKey: text("event_key").notNull(),
        occurredAt: ts("occurred_at"),
        recordedBy: text("recorded_by").references(() => user.id),
        notes: text("notes"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        uniqueIndex("bcpnp_case_event_case_key_uq").on(t.caseId, t.eventKey),
        index("bcpnp_case_event_case_idx").on(t.caseId),
    ]
);

export const bcpnpDeadline = dashboard.table(
    "bcpnp_deadline",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => bcpnpCase.id),
        ruleKey: text("rule_key").notNull(), // references bcpnp_rule.key for the offset
        label: text("label").notNull(),
        anchorEventId: uuid("anchor_event_id").references(() => bcpnpCaseEvent.id),
        dueAt: ts("due_at"),
        status: bcpnpDeadlineStatus("status").notNull().default("pending"),
        // [{days_before: 30, sent_at: "..."}]
        remindersSentAt: jsonb("reminders_sent_at").notNull().default(sql`'[]'::jsonb`),
        completedAt: ts("completed_at"),
        completedBy: text("completed_by").references(() => user.id),
        waiveReason: text("waive_reason"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index("bcpnp_deadline_case_idx").on(t.caseId),
        index("bcpnp_deadline_due_status_idx").on(t.dueAt, t.status),
    ]
);

// ─── Engagements (partner on a case) ──────────────────────────────────────────

export const bcpnpEngagement = dashboard.table(
    "bcpnp_engagement",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => bcpnpCase.id),
        userId: text("user_id").references(() => user.id),
        partnerId: uuid("partner_id").references(() => partner.id),
        partnerType: bcpnpPartnerType("partner_type").notNull(),
        docCategories: bcpnpDocCategory("doc_categories")
            .array()
            .notNull()
            .default(sql`'{}'::dashboard.bcpnp_doc_category[]`),
        status: text("status").notNull().default("active"), // active | completed | terminated
        engagedAt: ts("engaged_at").notNull().defaultNow(),
        endedAt: ts("ended_at"),
        paidHelper: boolean("paid_helper").notNull().default(false),
        disclosureNote: text("disclosure_note"),
        notes: text("notes"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index("bcpnp_engagement_case_idx").on(t.caseId),
        index("bcpnp_engagement_partner_idx").on(t.partnerId),
    ]
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type BcpnpStream = (typeof bcpnpStream.enumValues)[number];
export type BcpnpCaseStage = (typeof bcpnpCaseStage.enumValues)[number];
export type BcpnpCaseStatus = (typeof bcpnpCaseStatus.enumValues)[number];
export type BcpnpDeadlineStatus = (typeof bcpnpDeadlineStatus.enumValues)[number];
export type BcpnpDocCategory = (typeof bcpnpDocCategory.enumValues)[number];
export type BcpnpInvCategory = (typeof bcpnpInvCategory.enumValues)[number];
export type BcpnpPartnerType = (typeof bcpnpPartnerType.enumValues)[number];
