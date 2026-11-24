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

/**
 * Sub-tier for partner users (all share user_role='partner').
 * Stored on bcpnp_partner_member, not on the user row.
 */
export const bcpnpPartnerTier = dashboard.enum("bcpnp_partner_tier", [
    "org_admin",
    "l3",   // Licensed representative (RCIC / immigration lawyer)
    "l2",   // Advisor (accountant, business-plan writer)
    "l1",   // Referral (realtor, banker, community contact)
    "mk",   // Marketing partner
]);

/** Workbook preparation lifecycle — separate from bcpnp_case_stage (BC PNP process). */
export const bcpnpWorkbookStatus = dashboard.enum("bcpnp_workbook_status", [
    "draft",
    "ready_to_register",
    "registered",
    "invited",
    "closed",
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
    economicRegion: text("economic_region"),
    regionalDistrict: text("regional_district"),
    population: integer("population"),
    naicsPriorities: text("naics_priorities")
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    communityContactName: text("community_contact_name"),
    communityContactEmail: text("community_contact_email"),
    communityContactUrl: text("community_contact_url"),
    active: boolean("active").notNull().default(true),
    // Null = intake open. Set when BC PNP pauses intake for this community.
    pauseUntil: ts("pause_until"),
    // Date the community data was last verified against the BC PNP website.
    sourceUpdatedAt: date("source_updated_at"),
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
        // Workbook preparation lifecycle (separate from stage/status which track the BC PNP process).
        workbookStatus: bcpnpWorkbookStatus("workbook_status").notNull().default("draft"),
        displayTz: text("display_tz").notNull().default("America/Vancouver"),
        communityId: uuid("community_id").references(() => bcpnpCommunity.id),
        // Self-reference for Base co-registrant: set on the second applicant's case.
        coRegistrantCaseId: uuid("co_registrant_case_id").references(
            (): AnyPgColumn => bcpnpCase.id
        ),
        coRegistrantWindowExpiresAt: ts("co_registrant_window_expires_at"),
        // Marketing attribution — set on creation; only Superuser may change.
        campaignCode: text("campaign_code"),
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
        index("bcpnp_case_workbook_status_idx").on(t.workbookStatus),
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

// ─── Partner organisations ────────────────────────────────────────────────────

/**
 * A firm that holds one or more workbook partner users.
 * RCICs and immigration lawyers are verified manually by Superuser.
 */
export const bcpnpPartnerOrg = dashboard.table("bcpnp_partner_org", {
    id: id(),
    name: text("name").notNull(),
    // rcic_firm | law_firm | accounting_firm | realtor_firm | marketing | other
    type: text("type").notNull(),
    country: text("country").notNull().default("CA"),
    licenceNo: text("licence_no"),
    licenceVerifiedAt: ts("licence_verified_at"),
    verifiedBy: text("verified_by").references(() => user.id),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** A user's membership in a partner org, with a tier that controls what they can do. */
export const bcpnpPartnerMember = dashboard.table(
    "bcpnp_partner_member",
    {
        id: id(),
        orgId: uuid("org_id")
            .notNull()
            .references(() => bcpnpPartnerOrg.id),
        userId: text("user_id")
            .notNull()
            .references(() => user.id),
        tier: bcpnpPartnerTier("tier").notNull(),
        active: boolean("active").notNull().default(true),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        uniqueIndex("bcpnp_partner_member_org_user_uq").on(t.orgId, t.userId),
        index("bcpnp_partner_member_user_idx").on(t.userId),
        index("bcpnp_partner_member_org_idx").on(t.orgId),
    ]
);

/**
 * Assignment of a partner member to a specific workbook file, with
 * optional section-level grants (array of section_key strings).
 * Empty array = no section access; use tier defaults.
 */
export const bcpnpAssignment = dashboard.table(
    "bcpnp_assignment",
    {
        id: id(),
        fileId: uuid("file_id")
            .notNull()
            .references(() => bcpnpCase.id),
        memberId: uuid("member_id")
            .notNull()
            .references(() => bcpnpPartnerMember.id),
        // Which sections this member may access on this file. Null = use tier defaults.
        sectionGrants: text("section_grants").array(),
        expiresAt: ts("expires_at"),
        grantedBy: text("granted_by")
            .notNull()
            .references(() => user.id),
        revokedAt: ts("revoked_at"),
        revokedBy: text("revoked_by").references(() => user.id),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index("bcpnp_assignment_file_idx").on(t.fileId),
        index("bcpnp_assignment_member_idx").on(t.memberId),
    ]
);

/**
 * Applicant's consent for a partner org to access their file.
 * Required before any partner can be assigned to a file.
 */
export const bcpnpConsent = dashboard.table(
    "bcpnp_consent",
    {
        id: id(),
        fileId: uuid("file_id")
            .notNull()
            .references(() => bcpnpCase.id),
        orgId: uuid("org_id")
            .notNull()
            .references(() => bcpnpPartnerOrg.id),
        // "full_file" | "summary_only"
        scope: text("scope").notNull().default("full_file"),
        givenAt: ts("given_at").notNull().defaultNow(),
        withdrawnAt: ts("withdrawn_at"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        uniqueIndex("bcpnp_consent_file_org_uq").on(t.fileId, t.orgId),
        index("bcpnp_consent_file_idx").on(t.fileId),
    ]
);

/**
 * Marketing campaign codes created by MK-tier partner members.
 * code is unique and used as ?ref= / ?utm_campaign= in referral links.
 */
export const bcpnpCampaign = dashboard.table(
    "bcpnp_campaign",
    {
        id: id(),
        memberId: uuid("member_id")
            .notNull()
            .references(() => bcpnpPartnerMember.id),
        code: text("code").notNull().unique(),
        name: text("name").notNull(),
        active: boolean("active").notNull().default(true),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("bcpnp_campaign_member_idx").on(t.memberId)]
);

/**
 * Append-only workbook status transition log.
 * Only L3 and Superuser may advance the status.
 */
export const bcpnpStatusEvent = dashboard.table(
    "bcpnp_status_event",
    {
        id: id(),
        fileId: uuid("file_id")
            .notNull()
            .references(() => bcpnpCase.id),
        fromStatus: bcpnpWorkbookStatus("from_status"),
        toStatus: bcpnpWorkbookStatus("to_status").notNull(),
        actorId: text("actor_id")
            .notNull()
            .references(() => user.id),
        // { bcpnp_file_no, registration_date, invitation_date, reason }
        payload: jsonb("payload"),
        at: ts("at").notNull().defaultNow(),
    },
    (t) => [
        index("bcpnp_status_event_file_idx").on(t.fileId),
        index("bcpnp_status_event_at_idx").on(t.at),
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
export type BcpnpPartnerTier = (typeof bcpnpPartnerTier.enumValues)[number];
export type BcpnpWorkbookStatus = (typeof bcpnpWorkbookStatus.enumValues)[number];
