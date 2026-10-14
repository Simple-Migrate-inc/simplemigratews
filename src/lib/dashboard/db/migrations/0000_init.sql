CREATE SCHEMA IF NOT EXISTS "dashboard";
--> statement-breakpoint
CREATE TYPE "dashboard"."address_display_level" AS ENUM('full', 'street', 'area');--> statement-breakpoint
CREATE TYPE "dashboard"."case_stage" AS ENUM('invited', 'intake_in_progress', 'intake_review', 'documents_in_progress', 'readiness_released', 'shortlist_active', 'referred', 'closed');--> statement-breakpoint
CREATE TYPE "dashboard"."checklist_status" AS ENUM('missing', 'received', 'in_review', 'accepted', 'action_needed', 'expired');--> statement-breakpoint
CREATE TYPE "dashboard"."evidence_label" AS ENUM('seller_provided', 'public_record', 'estimate', 'independently_checked');--> statement-breakpoint
CREATE TYPE "dashboard"."grant_status" AS ENUM('proposed', 'approved', 'declined', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "dashboard"."grantee_type" AS ENUM('partner', 'agent');--> statement-breakpoint
CREATE TYPE "dashboard"."journey_type" AS ENUM('buy', 'start');--> statement-breakpoint
CREATE TYPE "dashboard"."listing_source" AS ENUM('agent_upload', 'csv', 'ddf', 'partner_feed');--> statement-breakpoint
CREATE TYPE "dashboard"."listing_status" AS ENUM('active', 'conditional', 'sold', 'leased', 'expired', 'withdrawn');--> statement-breakpoint
CREATE TYPE "dashboard"."property_type" AS ENUM('residential', 'commercial', 'industrial', 'retail', 'land', 'business_with_property');--> statement-breakpoint
CREATE TYPE "dashboard"."referral_status" AS ENUM('pending', 'accepted', 'declined', 'info_requested', 'in_progress', 'completed', 'closed');--> statement-breakpoint
CREATE TYPE "dashboard"."rule_kind" AS ENUM('immigration_pathway', 'property_restriction', 'property_tax', 'licensing');--> statement-breakpoint
CREATE TYPE "dashboard"."rule_status" AS ENUM('open', 'paused', 'closed', 'announced', 'in_force', 'expired');--> statement-breakpoint
CREATE TYPE "dashboard"."saved_purpose" AS ENUM('business_premises', 'settlement_housing', 'investment');--> statement-breakpoint
CREATE TYPE "dashboard"."transaction_type" AS ENUM('sale', 'lease');--> statement-breakpoint
CREATE TYPE "dashboard"."user_role" AS ENUM('candidate', 'consultant', 'admin', 'partner', 'agent');--> statement-breakpoint
CREATE TYPE "dashboard"."user_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TYPE "dashboard"."verification_status" AS ENUM('pending', 'verified', 'suspended', 'lapsed');--> statement-breakpoint
CREATE TABLE "dashboard"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"brokerage_id" uuid,
	"regulator" text NOT NULL,
	"licence_number" text NOT NULL,
	"licence_class" text,
	"provinces" text[] DEFAULT '{}'::text[] NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"specialties" text[] DEFAULT '{}'::text[] NOT NULL,
	"verified_at" timestamp with time zone,
	"verification_source" text,
	"reverify_due_at" timestamp with time zone,
	"status" "dashboard"."verification_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."agent_lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"listing_id" uuid,
	"consent_grant_id" uuid NOT NULL,
	"need" text NOT NULL,
	"referral_fee_disclosure" text,
	"status" "dashboard"."referral_status" DEFAULT 'pending' NOT NULL,
	"status_updates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."ai_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"feature" text NOT NULL,
	"prompt_version" text NOT NULL,
	"model" text NOT NULL,
	"input_refs" jsonb,
	"output" jsonb,
	"edited_ratio" double precision,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."analytics_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"actor_id" text,
	"case_id" uuid,
	"props" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"object_type" text NOT NULL,
	"object_id" text,
	"case_id" uuid,
	"ip" text,
	"user_agent" text,
	"meta" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."brokerage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"regulator" text NOT NULL,
	"licence_number" text NOT NULL,
	"province" text NOT NULL,
	"office_address" text,
	"verified_at" timestamp with time zone,
	"feed_agreement" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."business" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"legal_name" text,
	"province" text NOT NULL,
	"municipality" text,
	"naics" text,
	"price_band" text,
	"revenue_band" text,
	"staff_count" integer,
	"notes" text,
	"source" text,
	"sponsored" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."business_claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"claim" text NOT NULL,
	"value" text NOT NULL,
	"evidence_label" "dashboard"."evidence_label" NOT NULL,
	"source_ref" text,
	"checked_at" timestamp with time zone,
	"checked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."checklist_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"doc_type" text NOT NULL,
	"reason" text NOT NULL,
	"rule_id" text,
	"status" "dashboard"."checklist_status" DEFAULT 'missing' NOT NULL,
	"retired_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."cohort" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."consent_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"grantee_type" "dashboard"."grantee_type" NOT NULL,
	"partner_id" uuid,
	"agent_id" uuid,
	"scope" jsonb NOT NULL,
	"disclosure_text" text,
	"proposed_by" text,
	"status" "dashboard"."grant_status" DEFAULT 'proposed' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."consent_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"version" text NOT NULL,
	"wording" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."consistency_flag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"source_a_ref" text NOT NULL,
	"source_b_ref" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"dismissed_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."case" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" text NOT NULL,
	"consultant_id" text,
	"cohort_id" uuid,
	"stage" "dashboard"."case_stage" DEFAULT 'invited' NOT NULL,
	"journey_type" "dashboard"."journey_type",
	"target_provinces" text[] DEFAULT '{}'::text[] NOT NULL,
	"budget_band" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"close_outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_item_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"ai_doc_type" text,
	"extracted_fields" jsonb,
	"uploaded_by" text,
	"accepted_by" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."feature_flag" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."intake_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"section" text NOT NULL,
	"field_key" text NOT NULL,
	"value" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"flagged_by" text,
	"flag_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "dashboard"."user_role" NOT NULL,
	"name" text,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"cohort_id" uuid,
	"partner_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."listing_sync_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "dashboard"."listing_source" NOT NULL,
	"brokerage_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"created" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"deactivated" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb,
	"read_by" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."message_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"participants" text[] NOT NULL,
	"linked_object_type" text,
	"linked_object_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"name" text NOT NULL,
	"owner_role" "dashboard"."user_role" NOT NULL,
	"due_at" timestamp with time zone,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."partner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm" text NOT NULL,
	"type" text NOT NULL,
	"provinces" text[] DEFAULT '{}'::text[] NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"licence_numbers" jsonb,
	"fee_disclosure_text" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."partner_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."property_listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "dashboard"."listing_source" NOT NULL,
	"source_listing_id" text NOT NULL,
	"brokerage_id" uuid,
	"listing_agent_id" uuid,
	"property_type" "dashboard"."property_type" NOT NULL,
	"transaction" "dashboard"."transaction_type" NOT NULL,
	"price" numeric(14, 2),
	"lease_rate" text,
	"province" text NOT NULL,
	"municipality" text,
	"cma_name" text,
	"address" text,
	"address_display_level" "dashboard"."address_display_level" DEFAULT 'area' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"size_sqft" integer,
	"units" integer,
	"zoning" text,
	"title" text NOT NULL,
	"description" text,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_business_id" uuid,
	"status" "dashboard"."listing_status" DEFAULT 'active' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"attribution_text" text NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."readiness_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"ai_draft_ref" uuid,
	"reviewed_by" text,
	"licence_ref" text,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"consent_grant_id" uuid NOT NULL,
	"status" "dashboard"."referral_status" DEFAULT 'pending' NOT NULL,
	"status_updates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."rule_catalog_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "dashboard"."rule_kind" NOT NULL,
	"name" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"status" "dashboard"."rule_status" NOT NULL,
	"summary" text NOT NULL,
	"key_thresholds" jsonb,
	"applies_when" jsonb,
	"effective_until" timestamp with time zone,
	"source_url" text NOT NULL,
	"last_verified_at" timestamp with time zone NOT NULL,
	"verifier_id" text,
	"owner_id" text,
	"verification_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."saved_property" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"purpose" "dashboard"."saved_purpose" NOT NULL,
	"note" text,
	"consultant_note" text,
	"linked_shortlist_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."shortlist_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"rationale" text NOT NULL,
	"candidate_pathways" jsonb,
	"candidate_response" text,
	"response_reason" text,
	"nda_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dashboard"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"role" "dashboard"."user_role" DEFAULT 'candidate' NOT NULL,
	"status" "dashboard"."user_status" DEFAULT 'active' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"licence_number" text,
	"licence_body" text,
	"licence_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."agent" ADD CONSTRAINT "agent_brokerage_id_brokerage_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "dashboard"."brokerage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."agent_lead" ADD CONSTRAINT "agent_lead_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."agent_lead" ADD CONSTRAINT "agent_lead_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "dashboard"."agent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."agent_lead" ADD CONSTRAINT "agent_lead_listing_id_property_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "dashboard"."property_listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."agent_lead" ADD CONSTRAINT "agent_lead_consent_grant_id_consent_grant_id_fk" FOREIGN KEY ("consent_grant_id") REFERENCES "dashboard"."consent_grant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."ai_run" ADD CONSTRAINT "ai_run_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."ai_run" ADD CONSTRAINT "ai_run_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."business_claim" ADD CONSTRAINT "business_claim_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "dashboard"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."business_claim" ADD CONSTRAINT "business_claim_checked_by_user_id_fk" FOREIGN KEY ("checked_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."checklist_item" ADD CONSTRAINT "checklist_item_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."consent_grant" ADD CONSTRAINT "consent_grant_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."consent_grant" ADD CONSTRAINT "consent_grant_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "dashboard"."partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."consent_grant" ADD CONSTRAINT "consent_grant_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "dashboard"."agent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."consent_grant" ADD CONSTRAINT "consent_grant_proposed_by_user_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."consent_record" ADD CONSTRAINT "consent_record_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."consistency_flag" ADD CONSTRAINT "consistency_flag_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."case" ADD CONSTRAINT "case_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."case" ADD CONSTRAINT "case_consultant_id_user_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."case" ADD CONSTRAINT "case_cohort_id_cohort_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "dashboard"."cohort"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."document" ADD CONSTRAINT "document_checklist_item_id_checklist_item_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "dashboard"."checklist_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."document" ADD CONSTRAINT "document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."document" ADD CONSTRAINT "document_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."feature_flag" ADD CONSTRAINT "feature_flag_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."intake_response" ADD CONSTRAINT "intake_response_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."intake_response" ADD CONSTRAINT "intake_response_flagged_by_user_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."invitation" ADD CONSTRAINT "invitation_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."invitation" ADD CONSTRAINT "invitation_cohort_id_cohort_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "dashboard"."cohort"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."invitation" ADD CONSTRAINT "invitation_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "dashboard"."partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."listing_sync_run" ADD CONSTRAINT "listing_sync_run_brokerage_id_brokerage_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "dashboard"."brokerage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."message" ADD CONSTRAINT "message_thread_id_message_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "dashboard"."message_thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."message" ADD CONSTRAINT "message_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."message_thread" ADD CONSTRAINT "message_thread_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."milestone" ADD CONSTRAINT "milestone_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."partner_member" ADD CONSTRAINT "partner_member_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "dashboard"."partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."partner_member" ADD CONSTRAINT "partner_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."property_listing" ADD CONSTRAINT "property_listing_brokerage_id_brokerage_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "dashboard"."brokerage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."property_listing" ADD CONSTRAINT "property_listing_listing_agent_id_agent_id_fk" FOREIGN KEY ("listing_agent_id") REFERENCES "dashboard"."agent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."property_listing" ADD CONSTRAINT "property_listing_linked_business_id_business_id_fk" FOREIGN KEY ("linked_business_id") REFERENCES "dashboard"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."readiness_summary" ADD CONSTRAINT "readiness_summary_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."readiness_summary" ADD CONSTRAINT "readiness_summary_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."referral" ADD CONSTRAINT "referral_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."referral" ADD CONSTRAINT "referral_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "dashboard"."partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."referral" ADD CONSTRAINT "referral_consent_grant_id_consent_grant_id_fk" FOREIGN KEY ("consent_grant_id") REFERENCES "dashboard"."consent_grant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."rule_catalog_entry" ADD CONSTRAINT "rule_catalog_entry_verifier_id_user_id_fk" FOREIGN KEY ("verifier_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."rule_catalog_entry" ADD CONSTRAINT "rule_catalog_entry_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."saved_property" ADD CONSTRAINT "saved_property_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."saved_property" ADD CONSTRAINT "saved_property_listing_id_property_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "dashboard"."property_listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."saved_property" ADD CONSTRAINT "saved_property_linked_shortlist_entry_id_shortlist_entry_id_fk" FOREIGN KEY ("linked_shortlist_entry_id") REFERENCES "dashboard"."shortlist_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."shortlist_entry" ADD CONSTRAINT "shortlist_entry_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."shortlist_entry" ADD CONSTRAINT "shortlist_entry_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "dashboard"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "dashboard"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_brokerage_idx" ON "dashboard"."agent" USING btree ("brokerage_id");--> statement-breakpoint
CREATE INDEX "analytics_event_name_at_idx" ON "dashboard"."analytics_event" USING btree ("name","at");--> statement-breakpoint
CREATE INDEX "audit_event_actor_idx" ON "dashboard"."audit_event" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_event_object_idx" ON "dashboard"."audit_event" USING btree ("object_type","object_id");--> statement-breakpoint
CREATE INDEX "audit_event_at_idx" ON "dashboard"."audit_event" USING btree ("at");--> statement-breakpoint
CREATE INDEX "checklist_item_case_idx" ON "dashboard"."checklist_item" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "consent_grant_case_idx" ON "dashboard"."consent_grant" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "consent_record_user_idx" ON "dashboard"."consent_record" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "case_candidate_idx" ON "dashboard"."case" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "case_consultant_idx" ON "dashboard"."case" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "document_checklist_idx" ON "dashboard"."document" USING btree ("checklist_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intake_response_case_field_uq" ON "dashboard"."intake_response" USING btree ("case_id","field_key");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "dashboard"."invitation" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_member_uq" ON "dashboard"."partner_member" USING btree ("partner_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "property_listing_source_uq" ON "dashboard"."property_listing" USING btree ("source","source_listing_id");--> statement-breakpoint
CREATE INDEX "property_listing_search_idx" ON "dashboard"."property_listing" USING btree ("province","property_type","status");--> statement-breakpoint
CREATE UNIQUE INDEX "readiness_summary_case_version_uq" ON "dashboard"."readiness_summary" USING btree ("case_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_property_case_listing_uq" ON "dashboard"."saved_property" USING btree ("case_id","listing_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "dashboard"."session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shortlist_case_business_uq" ON "dashboard"."shortlist_entry" USING btree ("case_id","business_id");--> statement-breakpoint
CREATE INDEX "two_factor_user_idx" ON "dashboard"."two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_idx" ON "dashboard"."two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "dashboard"."verification" USING btree ("identifier");