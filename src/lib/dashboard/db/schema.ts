/**
 * Readiness Dashboard schema.
 *
 * Every table lives in the `dashboard` Postgres schema so nothing here can
 * collide with, or alter, anything else in the database. Migrations are
 * additive only — never drop or rename a column that has shipped.
 */
import { sql } from "drizzle-orm";
import {
    boolean,
    doublePrecision,
    index,
    integer,
    jsonb,
    numeric,
    pgSchema,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

export const dashboard = pgSchema("dashboard");

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () =>
    ts("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date());
const id = () => uuid("id").primaryKey().defaultRandom();

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRole = dashboard.enum("user_role", [
    "candidate",
    "consultant",
    "admin",
    "partner",
    "agent",
]);
export const userStatus = dashboard.enum("user_status", [
    "active",
    "suspended",
    "deactivated",
]);
export const caseStage = dashboard.enum("case_stage", [
    "invited",
    "intake_in_progress",
    "intake_review",
    "documents_in_progress",
    "readiness_released",
    "shortlist_active",
    "referred",
    "closed",
]);
export const journeyType = dashboard.enum("journey_type", ["buy", "start"]);
export const checklistStatus = dashboard.enum("checklist_status", [
    "missing",
    "received",
    "in_review",
    "accepted",
    "action_needed",
    "expired",
]);
export const evidenceLabel = dashboard.enum("evidence_label", [
    "seller_provided",
    "public_record",
    "estimate",
    "independently_checked",
]);
export const ruleKind = dashboard.enum("rule_kind", [
    "immigration_pathway",
    "property_restriction",
    "property_tax",
    "licensing",
]);
export const ruleStatus = dashboard.enum("rule_status", [
    "open",
    "paused",
    "closed",
    "announced",
    "in_force",
    "expired",
]);
export const granteeType = dashboard.enum("grantee_type", ["partner", "agent"]);
export const grantStatus = dashboard.enum("grant_status", [
    "proposed",
    "approved",
    "declined",
    "revoked",
    "expired",
]);
export const referralStatus = dashboard.enum("referral_status", [
    "pending",
    "accepted",
    "declined",
    "info_requested",
    "in_progress",
    "completed",
    "closed",
]);
export const listingSource = dashboard.enum("listing_source", [
    "agent_upload",
    "csv",
    "ddf",
    "partner_feed",
]);
export const propertyType = dashboard.enum("property_type", [
    "residential",
    "commercial",
    "industrial",
    "retail",
    "land",
    "business_with_property",
]);
export const transactionType = dashboard.enum("transaction_type", ["sale", "lease"]);
export const listingStatus = dashboard.enum("listing_status", [
    "active",
    "conditional",
    "sold",
    "leased",
    "expired",
    "withdrawn",
]);
export const addressDisplayLevel = dashboard.enum("address_display_level", [
    "full",
    "street",
    "area",
]);
export const savedPurpose = dashboard.enum("saved_purpose", [
    "business_premises",
    "settlement_housing",
    "investment",
]);
export const verificationStatus = dashboard.enum("verification_status", [
    "pending",
    "verified",
    "suspended",
    "lapsed",
]);

// ─── Auth (Better Auth models: user, session, account, verification, twoFactor)

export const user = dashboard.table("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    role: userRole("role").notNull().default("candidate"),
    status: userStatus("status").notNull().default("active"),
    locale: text("locale").notNull().default("en"),
    licenceNumber: text("licence_number"),
    licenceBody: text("licence_body"),
    licenceVerifiedAt: ts("licence_verified_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const session = dashboard.table(
    "session",
    {
        id: text("id").primaryKey(),
        token: text("token").notNull().unique(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        expiresAt: ts("expires_at").notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("session_user_idx").on(t.userId)]
);

export const account = dashboard.table(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: ts("access_token_expires_at"),
        refreshTokenExpiresAt: ts("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("account_user_idx").on(t.userId)]
);

export const verification = dashboard.table(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: ts("expires_at").notNull(),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("verification_identifier_idx").on(t.identifier)]
);

export const twoFactor = dashboard.table(
    "two_factor",
    {
        id: text("id").primaryKey(),
        secret: text("secret").notNull(),
        backupCodes: text("backup_codes").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        verified: boolean("verified").default(true),
        failedVerificationCount: integer("failed_verification_count").default(0),
        lockedUntil: ts("locked_until"),
    },
    (t) => [
        index("two_factor_user_idx").on(t.userId),
        index("two_factor_secret_idx").on(t.secret),
    ]
);

// ─── Onboarding ──────────────────────────────────────────────────────────────

export const invitation = dashboard.table(
    "invitation",
    {
        id: id(),
        email: text("email").notNull(),
        role: userRole("role").notNull(),
        name: text("name"),
        tokenHash: text("token_hash").notNull().unique(),
        invitedBy: text("invited_by").references(() => user.id),
        cohortId: uuid("cohort_id").references(() => cohort.id),
        partnerId: uuid("partner_id").references(() => partner.id),
        expiresAt: ts("expires_at").notNull(),
        // Set atomically when acceptance starts, so a link can't be used twice.
        claimedAt: ts("claimed_at"),
        usedAt: ts("used_at"),
        revokedAt: ts("revoked_at"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("invitation_email_idx").on(t.email)]
);

/** Exact wording the user agreed to, with timestamp — never edited. */
export const consentRecord = dashboard.table(
    "consent_record",
    {
        id: id(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id),
        kind: text("kind").notNull(), // terms | privacy | data_processing | ...
        version: text("version").notNull(),
        wording: text("wording").notNull(),
        acceptedAt: ts("accepted_at").notNull().defaultNow(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("consent_record_user_idx").on(t.userId)]
);

// ─── Cases ───────────────────────────────────────────────────────────────────

export const cohort = dashboard.table("cohort", {
    id: id(),
    name: text("name").notNull(),
    startDate: ts("start_date"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const dashCase = dashboard.table(
    "case",
    {
        id: id(),
        candidateId: text("candidate_id")
            .notNull()
            .references(() => user.id),
        consultantId: text("consultant_id").references(() => user.id),
        cohortId: uuid("cohort_id").references(() => cohort.id),
        stage: caseStage("stage").notNull().default("invited"),
        journeyType: journeyType("journey_type"),
        targetProvinces: text("target_provinces")
            .array()
            .notNull()
            .default(sql`'{}'::text[]`),
        budgetBand: text("budget_band"),
        openedAt: ts("opened_at").notNull().defaultNow(),
        closedAt: ts("closed_at"),
        closeOutcome: text("close_outcome"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index("case_candidate_idx").on(t.candidateId),
        index("case_consultant_idx").on(t.consultantId),
    ]
);

export const intakeResponse = dashboard.table(
    "intake_response",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => dashCase.id),
        section: text("section").notNull(),
        fieldKey: text("field_key").notNull(),
        value: jsonb("value"),
        version: integer("version").notNull().default(1),
        flaggedBy: text("flagged_by").references(() => user.id),
        flagNote: text("flag_note"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [uniqueIndex("intake_response_case_field_uq").on(t.caseId, t.fieldKey)]
);

export const checklistItem = dashboard.table(
    "checklist_item",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => dashCase.id),
        docType: text("doc_type").notNull(),
        reason: text("reason").notNull(),
        ruleId: text("rule_id"),
        status: checklistStatus("status").notNull().default("missing"),
        retiredAt: ts("retired_at"),
        dueAt: ts("due_at"),
        expiresAt: ts("expires_at"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("checklist_item_case_idx").on(t.caseId)]
);

export const document = dashboard.table(
    "document",
    {
        id: id(),
        checklistItemId: uuid("checklist_item_id")
            .notNull()
            .references(() => checklistItem.id),
        storageKey: text("storage_key").notNull(),
        filename: text("filename").notNull(),
        mime: text("mime").notNull(),
        size: integer("size").notNull(),
        version: integer("version").notNull().default(1),
        scanStatus: text("scan_status").notNull().default("pending"), // pending | clean | infected | error
        aiDocType: text("ai_doc_type"),
        extractedFields: jsonb("extracted_fields"),
        uploadedBy: text("uploaded_by").references(() => user.id),
        acceptedBy: text("accepted_by").references(() => user.id),
        acceptedAt: ts("accepted_at"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("document_checklist_idx").on(t.checklistItemId)]
);

export const consistencyFlag = dashboard.table("consistency_flag", {
    id: id(),
    caseId: uuid("case_id")
        .notNull()
        .references(() => dashCase.id),
    fieldKey: text("field_key").notNull(),
    sourceARef: text("source_a_ref").notNull(),
    sourceBRef: text("source_b_ref").notNull(),
    status: text("status").notNull().default("open"), // open | resolved | dismissed
    dismissedReason: text("dismissed_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** Immutable once released — edits create a new version row. */
export const readinessSummary = dashboard.table(
    "readiness_summary",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => dashCase.id),
        version: integer("version").notNull(),
        content: jsonb("content").notNull(),
        aiDraftRef: uuid("ai_draft_ref"),
        reviewedBy: text("reviewed_by").references(() => user.id),
        licenceRef: text("licence_ref"),
        releasedAt: ts("released_at"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [uniqueIndex("readiness_summary_case_version_uq").on(t.caseId, t.version)]
);

export const milestone = dashboard.table("milestone", {
    id: id(),
    caseId: uuid("case_id")
        .notNull()
        .references(() => dashCase.id),
    name: text("name").notNull(),
    ownerRole: userRole("owner_role").notNull(),
    dueAt: ts("due_at"),
    doneAt: ts("done_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const messageThread = dashboard.table("message_thread", {
    id: id(),
    caseId: uuid("case_id")
        .notNull()
        .references(() => dashCase.id),
    subject: text("subject").notNull(),
    participants: text("participants").array().notNull(),
    linkedObjectType: text("linked_object_type"),
    linkedObjectId: text("linked_object_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const message = dashboard.table("message", {
    id: id(),
    threadId: uuid("thread_id")
        .notNull()
        .references(() => messageThread.id),
    authorId: text("author_id")
        .notNull()
        .references(() => user.id),
    body: text("body").notNull(),
    attachments: jsonb("attachments"),
    readBy: jsonb("read_by").notNull().default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

// ─── Businesses and shortlists ───────────────────────────────────────────────

export const business = dashboard.table("business", {
    id: id(),
    displayName: text("display_name").notNull(), // anonymized
    legalName: text("legal_name"), // restricted: only after NDA
    province: text("province").notNull(),
    municipality: text("municipality"),
    naics: text("naics"),
    priceBand: text("price_band"),
    revenueBand: text("revenue_band"),
    staffCount: integer("staff_count"),
    notes: text("notes"),
    source: text("source"),
    sponsored: boolean("sponsored").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const businessClaim = dashboard.table("business_claim", {
    id: id(),
    businessId: uuid("business_id")
        .notNull()
        .references(() => business.id),
    claim: text("claim").notNull(),
    value: text("value").notNull(),
    evidenceLabel: evidenceLabel("evidence_label").notNull(),
    sourceRef: text("source_ref"),
    checkedAt: ts("checked_at"),
    checkedBy: text("checked_by").references(() => user.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const shortlistEntry = dashboard.table(
    "shortlist_entry",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => dashCase.id),
        businessId: uuid("business_id")
            .notNull()
            .references(() => business.id),
        rationale: text("rationale").notNull(),
        candidatePathways: jsonb("candidate_pathways"),
        candidateResponse: text("candidate_response"), // interested | declined
        responseReason: text("response_reason"),
        ndaComplete: boolean("nda_complete").notNull().default(false),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [uniqueIndex("shortlist_case_business_uq").on(t.caseId, t.businessId)]
);

// ─── Partners, consent and referrals ─────────────────────────────────────────

export const partner = dashboard.table("partner", {
    id: id(),
    firm: text("firm").notNull(),
    type: text("type").notNull(), // lender | lawyer | accountant | broker
    provinces: text("provinces").array().notNull().default(sql`'{}'::text[]`),
    languages: text("languages").array().notNull().default(sql`'{}'::text[]`),
    licenceNumbers: jsonb("licence_numbers"),
    feeDisclosureText: text("fee_disclosure_text"),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const partnerMember = dashboard.table(
    "partner_member",
    {
        id: id(),
        partnerId: uuid("partner_id")
            .notNull()
            .references(() => partner.id),
        userId: text("user_id")
            .notNull()
            .references(() => user.id),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [uniqueIndex("partner_member_uq").on(t.partnerId, t.userId)]
);

/**
 * A candidate-approved, scoped, expiring grant of access to part of their
 * file. Shared by partner referrals and agent leads.
 */
export const consentGrant = dashboard.table(
    "consent_grant",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => dashCase.id),
        granteeType: granteeType("grantee_type").notNull(),
        partnerId: uuid("partner_id").references(() => partner.id),
        agentId: uuid("agent_id").references(() => agent.id),
        // { documentIds: string[], summaryVersion?: number, includeImmigrationDocuments: boolean, fields?: string[] }
        scope: jsonb("scope").notNull(),
        disclosureText: text("disclosure_text"),
        proposedBy: text("proposed_by").references(() => user.id),
        status: grantStatus("status").notNull().default("proposed"),
        expiresAt: ts("expires_at").notNull(),
        approvedAt: ts("approved_at"),
        revokedAt: ts("revoked_at"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("consent_grant_case_idx").on(t.caseId)]
);

export const referral = dashboard.table("referral", {
    id: id(),
    caseId: uuid("case_id")
        .notNull()
        .references(() => dashCase.id),
    partnerId: uuid("partner_id")
        .notNull()
        .references(() => partner.id),
    consentGrantId: uuid("consent_grant_id")
        .notNull()
        .references(() => consentGrant.id),
    status: referralStatus("status").notNull().default("pending"),
    statusUpdates: jsonb("status_updates").notNull().default(sql`'[]'::jsonb`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

// ─── Rules catalogue (immigration pathways, property rules, ...) ─────────────

export const ruleCatalogEntry = dashboard.table("rule_catalog_entry", {
    id: id(),
    kind: ruleKind("kind").notNull(),
    name: text("name").notNull(),
    jurisdiction: text("jurisdiction").notNull(), // e.g. CA, CA-BC
    status: ruleStatus("status").notNull(),
    summary: text("summary").notNull(),
    keyThresholds: jsonb("key_thresholds"),
    appliesWhen: jsonb("applies_when"),
    // When set, the rule stops applying after this date and its notice changes
    // automatically (e.g. a temporary prohibition with a sunset date).
    effectiveUntil: ts("effective_until"),
    sourceUrl: text("source_url").notNull(),
    lastVerifiedAt: ts("last_verified_at").notNull(),
    verifierId: text("verifier_id").references(() => user.id),
    ownerId: text("owner_id").references(() => user.id),
    verificationNote: text("verification_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

// ─── Real estate ─────────────────────────────────────────────────────────────

export const brokerage = dashboard.table("brokerage", {
    id: id(),
    name: text("name").notNull(),
    regulator: text("regulator").notNull(),
    licenceNumber: text("licence_number").notNull(),
    province: text("province").notNull(),
    officeAddress: text("office_address"),
    verifiedAt: ts("verified_at"),
    feedAgreement: jsonb("feed_agreement"), // { source, scope, signedAt, expiresAt }
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const agent = dashboard.table(
    "agent",
    {
        id: id(),
        userId: text("user_id")
            .notNull()
            .unique()
            .references(() => user.id),
        brokerageId: uuid("brokerage_id").references(() => brokerage.id),
        regulator: text("regulator").notNull(),
        licenceNumber: text("licence_number").notNull(),
        licenceClass: text("licence_class"),
        provinces: text("provinces").array().notNull().default(sql`'{}'::text[]`),
        languages: text("languages").array().notNull().default(sql`'{}'::text[]`),
        specialties: text("specialties").array().notNull().default(sql`'{}'::text[]`),
        verifiedAt: ts("verified_at"),
        verificationSource: text("verification_source"),
        reverifyDueAt: ts("reverify_due_at"),
        status: verificationStatus("status").notNull().default("pending"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index("agent_brokerage_idx").on(t.brokerageId)]
);

export const propertyListing = dashboard.table(
    "property_listing",
    {
        id: id(),
        source: listingSource("source").notNull(),
        sourceListingId: text("source_listing_id").notNull(),
        brokerageId: uuid("brokerage_id").references(() => brokerage.id),
        listingAgentId: uuid("listing_agent_id").references(() => agent.id),
        propertyType: propertyType("property_type").notNull(),
        transaction: transactionType("transaction").notNull(),
        price: numeric("price", { precision: 14, scale: 2 }),
        leaseRate: text("lease_rate"),
        province: text("province").notNull(),
        municipality: text("municipality"),
        // Census metropolitan area / agglomeration, used for rule notices.
        cmaName: text("cma_name"),
        address: text("address"),
        addressDisplayLevel: addressDisplayLevel("address_display_level")
            .notNull()
            .default("area"),
        lat: doublePrecision("lat"),
        lng: doublePrecision("lng"),
        sizeSqft: integer("size_sqft"),
        units: integer("units"),
        zoning: text("zoning"),
        title: text("title").notNull(),
        description: text("description"),
        media: jsonb("media").notNull().default(sql`'[]'::jsonb`),
        linkedBusinessId: uuid("linked_business_id").references(() => business.id),
        status: listingStatus("status").notNull().default("active"),
        hidden: boolean("hidden").notNull().default(false), // admin moderation
        attributionText: text("attribution_text").notNull(),
        lastSyncedAt: ts("last_synced_at").notNull().defaultNow(),
        raw: jsonb("raw"),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        uniqueIndex("property_listing_source_uq").on(t.source, t.sourceListingId),
        index("property_listing_search_idx").on(t.province, t.propertyType, t.status),
    ]
);

export const savedProperty = dashboard.table(
    "saved_property",
    {
        id: id(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => dashCase.id),
        listingId: uuid("listing_id")
            .notNull()
            .references(() => propertyListing.id),
        purpose: savedPurpose("purpose").notNull(),
        note: text("note"),
        consultantNote: text("consultant_note"),
        linkedShortlistEntryId: uuid("linked_shortlist_entry_id").references(
            () => shortlistEntry.id
        ),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [uniqueIndex("saved_property_case_listing_uq").on(t.caseId, t.listingId)]
);

export const agentLead = dashboard.table("agent_lead", {
    id: id(),
    caseId: uuid("case_id")
        .notNull()
        .references(() => dashCase.id),
    agentId: uuid("agent_id")
        .notNull()
        .references(() => agent.id),
    listingId: uuid("listing_id").references(() => propertyListing.id),
    consentGrantId: uuid("consent_grant_id")
        .notNull()
        .references(() => consentGrant.id),
    need: text("need").notNull(),
    referralFeeDisclosure: text("referral_fee_disclosure"),
    status: referralStatus("status").notNull().default("pending"),
    statusUpdates: jsonb("status_updates").notNull().default(sql`'[]'::jsonb`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export const listingSyncRun = dashboard.table("listing_sync_run", {
    id: id(),
    source: listingSource("source").notNull(),
    brokerageId: uuid("brokerage_id").references(() => brokerage.id),
    startedAt: ts("started_at").notNull().defaultNow(),
    finishedAt: ts("finished_at"),
    created: integer("created").notNull().default(0),
    updated: integer("updated").notNull().default(0),
    deactivated: integer("deactivated").notNull().default(0),
    errors: jsonb("errors").notNull().default(sql`'[]'::jsonb`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

// ─── AI, audit, analytics, flags ─────────────────────────────────────────────

export const aiRun = dashboard.table("ai_run", {
    id: id(),
    caseId: uuid("case_id").references(() => dashCase.id),
    feature: text("feature").notNull(),
    promptVersion: text("prompt_version").notNull(),
    model: text("model").notNull(),
    inputRefs: jsonb("input_refs"),
    output: jsonb("output"),
    editedRatio: doublePrecision("edited_ratio"),
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewedAt: ts("reviewed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

/** Append-only. A database trigger rejects UPDATE and DELETE. */
export const auditEvent = dashboard.table(
    "audit_event",
    {
        id: id(),
        actorId: text("actor_id"),
        action: text("action").notNull(),
        objectType: text("object_type").notNull(),
        objectId: text("object_id"),
        caseId: uuid("case_id"),
        ip: text("ip"),
        userAgent: text("user_agent"),
        meta: jsonb("meta"),
        at: ts("at").notNull().defaultNow(),
    },
    (t) => [
        index("audit_event_actor_idx").on(t.actorId),
        index("audit_event_object_idx").on(t.objectType, t.objectId),
        index("audit_event_at_idx").on(t.at),
    ]
);

export const analyticsEvent = dashboard.table(
    "analytics_event",
    {
        id: id(),
        name: text("name").notNull(),
        actorId: text("actor_id"),
        caseId: uuid("case_id"),
        props: jsonb("props"),
        at: ts("at").notNull().defaultNow(),
    },
    (t) => [index("analytics_event_name_at_idx").on(t.name, t.at)]
);

/** Admin kill switches (e.g. per AI feature). Env flags override nothing here. */
export const featureFlag = dashboard.table("feature_flag", {
    key: text("key").primaryKey(),
    enabled: boolean("enabled").notNull().default(false),
    updatedBy: text("updated_by").references(() => user.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
});

export type UserRole = (typeof userRole.enumValues)[number];
export type CaseStage = (typeof caseStage.enumValues)[number];
