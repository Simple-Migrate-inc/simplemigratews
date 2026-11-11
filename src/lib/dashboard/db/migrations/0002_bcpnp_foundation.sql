CREATE TYPE "dashboard"."bcpnp_case_stage" AS ENUM('intake_eligibility', 'business_concept', 'exploratory_visit', 'registration', 'qualified_pool', 'application', 'interview_performance', 'work_permit_arrival', 'business_establishment', 'final_report_nomination');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_case_status" AS ENUM('active', 'withdrawn', 'closed', 'nominated');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_deadline_status" AS ENUM('pending', 'due_soon', 'overdue', 'completed', 'waived');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_doc_category" AS ENUM('identity', 'financial', 'business', 'immigration', 'legal', 'other');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_inv_category" AS ENUM('equipment', 'leasehold', 'marketing', 'operating', 'inventory', 'vehicle', 'purchase_price', 'other');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_job_status" AS ENUM('planned', 'hired', 'active', 'terminated');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_partner_type" AS ENUM('immigration_representative', 'accounting_firm', 'cpa', 'realtor', 'business_broker', 'financing_partner', 'business_services', 'community_contact');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_stream" AS ENUM('base', 'regional');--> statement-breakpoint
ALTER TYPE "dashboard"."user_role" ADD VALUE 'superuser';--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_applicant_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"net_worth_cad_cents" integer,
	"proposed_investment_cad_cents" integer,
	"proposed_ownership_pct" numeric(5, 2),
	"equity_investment_cad_cents" integer,
	"owner_manager_months" integer,
	"senior_manager_months" integer,
	"owner_manager_pct" numeric(5, 2),
	"senior_manager_direct_reports" integer,
	"has_post_secondary" boolean,
	"self_employed_months_last_60" integer,
	"language_test_type" text,
	"language_scores" jsonb,
	"has_exploratory_visit" boolean,
	"has_community_referral" boolean,
	"business_type" text,
	"current_owner_operated_months" integer,
	"residence_within_km" boolean,
	"no_long_ferry" boolean,
	"residence_inside_community" boolean,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bcpnp_applicant_profile_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_business_concept" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"naics_code" text,
	"naics_description" text,
	"business_type" text,
	"business_name" text,
	"business_location" text,
	"current_owner_operated_months" integer,
	"is_going_concern" boolean,
	"num_existing_jobs_to_maintain" integer,
	"purchase_price_cad_cents" integer,
	"ownership_pct" numeric(5, 2),
	"equity_investment_cad_cents" integer,
	"ineligible_flag" text,
	"regulated_sector_flag" text,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_case" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" text NOT NULL,
	"superuser_id" text,
	"consultant_id" text,
	"guide_edition_id" uuid,
	"stream" "dashboard"."bcpnp_stream",
	"stage" "dashboard"."bcpnp_case_stage" DEFAULT 'intake_eligibility' NOT NULL,
	"status" "dashboard"."bcpnp_case_status" DEFAULT 'active' NOT NULL,
	"display_tz" text DEFAULT 'America/Vancouver' NOT NULL,
	"community_id" uuid,
	"co_registrant_case_id" uuid,
	"co_registrant_window_expires_at" timestamp with time zone,
	"notes" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"close_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_case_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"event_key" text NOT NULL,
	"occurred_at" timestamp with time zone,
	"recorded_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_community" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"population" integer,
	"naics_priorities" text[] DEFAULT '{}'::text[] NOT NULL,
	"community_contact_name" text,
	"community_contact_email" text,
	"community_contact_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_deadline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"rule_key" text NOT NULL,
	"label" text NOT NULL,
	"anchor_event_id" uuid,
	"due_at" timestamp with time zone,
	"status" "dashboard"."bcpnp_deadline_status" DEFAULT 'pending' NOT NULL,
	"reminders_sent_at" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"waive_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"category" "dashboard"."bcpnp_doc_category" NOT NULL,
	"doc_type" text NOT NULL,
	"label" text NOT NULL,
	"storage_key" text,
	"filename" text,
	"mime" text,
	"size_bytes" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"expiry_date" date,
	"translation_status" text,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"deleted_at" timestamp with time zone,
	"uploaded_by" text,
	"accepted_by" text,
	"accepted_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_document_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"shared_with_user_id" text,
	"shared_with_partner_id" uuid,
	"purpose" text NOT NULL,
	"consent_note" text,
	"shared_by" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_engagement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"user_id" text,
	"partner_id" uuid,
	"partner_type" "dashboard"."bcpnp_partner_type" NOT NULL,
	"doc_categories" "dashboard"."bcpnp_doc_category"[] DEFAULT '{}'::dashboard.bcpnp_doc_category[] NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"engaged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"paid_helper" boolean DEFAULT false NOT NULL,
	"disclosure_note" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_family_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"name" text NOT NULL,
	"dob" date,
	"citizenship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_guide_edition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bcpnp_guide_edition_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_investment_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concept_id" uuid NOT NULL,
	"description" text NOT NULL,
	"category" "dashboard"."bcpnp_inv_category" NOT NULL,
	"amount_cad_cents" integer NOT NULL,
	"cap_applied_cad_cents" integer,
	"eligible_cad_cents" integer DEFAULT 0 NOT NULL,
	"cap_reason" text,
	"pre_ita" boolean DEFAULT false NOT NULL,
	"external_financing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_job_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concept_id" uuid NOT NULL,
	"job_title" text NOT NULL,
	"hours_per_week" integer NOT NULL,
	"annual_hours" integer NOT NULL,
	"start_date" date,
	"is_on_site" boolean DEFAULT true NOT NULL,
	"is_direct_employee" boolean DEFAULT true NOT NULL,
	"shareholder_pct" numeric(5, 2),
	"status" "dashboard"."bcpnp_job_status" DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" uuid NOT NULL,
	"stream" "dashboard"."bcpnp_stream",
	"key" text NOT NULL,
	"value_num" numeric(15, 4),
	"value_text" text,
	"value_json" jsonb,
	"unit" text,
	"description" text NOT NULL,
	"source_ref" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_score" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"experience_points" integer,
	"net_worth_points" integer,
	"investment_points" integer,
	"jobs_points" integer,
	"region_points" integer,
	"adaptability_points" integer,
	"community_population_points" integer,
	"self_declared_total" integer,
	"concept_score_min" integer,
	"concept_score_max" integer,
	"concept_score_actual" integer,
	"meets_pool_minimum" boolean,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"computed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_applicant_profile" ADD CONSTRAINT "bcpnp_applicant_profile_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_business_concept" ADD CONSTRAINT "bcpnp_business_concept_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_business_concept" ADD CONSTRAINT "bcpnp_business_concept_locked_by_user_id_fk" FOREIGN KEY ("locked_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD CONSTRAINT "bcpnp_case_applicant_id_user_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD CONSTRAINT "bcpnp_case_superuser_id_user_id_fk" FOREIGN KEY ("superuser_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD CONSTRAINT "bcpnp_case_consultant_id_user_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD CONSTRAINT "bcpnp_case_guide_edition_id_bcpnp_guide_edition_id_fk" FOREIGN KEY ("guide_edition_id") REFERENCES "dashboard"."bcpnp_guide_edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD CONSTRAINT "bcpnp_case_community_id_bcpnp_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "dashboard"."bcpnp_community"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD CONSTRAINT "bcpnp_case_co_registrant_case_id_bcpnp_case_id_fk" FOREIGN KEY ("co_registrant_case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case_event" ADD CONSTRAINT "bcpnp_case_event_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case_event" ADD CONSTRAINT "bcpnp_case_event_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_deadline" ADD CONSTRAINT "bcpnp_deadline_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_deadline" ADD CONSTRAINT "bcpnp_deadline_anchor_event_id_bcpnp_case_event_id_fk" FOREIGN KEY ("anchor_event_id") REFERENCES "dashboard"."bcpnp_case_event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_deadline" ADD CONSTRAINT "bcpnp_deadline_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_document" ADD CONSTRAINT "bcpnp_document_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_document" ADD CONSTRAINT "bcpnp_document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_document" ADD CONSTRAINT "bcpnp_document_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_document_share" ADD CONSTRAINT "bcpnp_document_share_document_id_bcpnp_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "dashboard"."bcpnp_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_document_share" ADD CONSTRAINT "bcpnp_document_share_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_document_share" ADD CONSTRAINT "bcpnp_document_share_shared_with_partner_id_partner_id_fk" FOREIGN KEY ("shared_with_partner_id") REFERENCES "dashboard"."partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_document_share" ADD CONSTRAINT "bcpnp_document_share_shared_by_user_id_fk" FOREIGN KEY ("shared_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_engagement" ADD CONSTRAINT "bcpnp_engagement_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_engagement" ADD CONSTRAINT "bcpnp_engagement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_engagement" ADD CONSTRAINT "bcpnp_engagement_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "dashboard"."partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_family_member" ADD CONSTRAINT "bcpnp_family_member_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_investment_line" ADD CONSTRAINT "bcpnp_investment_line_concept_id_bcpnp_business_concept_id_fk" FOREIGN KEY ("concept_id") REFERENCES "dashboard"."bcpnp_business_concept"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_job_plan" ADD CONSTRAINT "bcpnp_job_plan_concept_id_bcpnp_business_concept_id_fk" FOREIGN KEY ("concept_id") REFERENCES "dashboard"."bcpnp_business_concept"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_rule" ADD CONSTRAINT "bcpnp_rule_edition_id_bcpnp_guide_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "dashboard"."bcpnp_guide_edition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_score" ADD CONSTRAINT "bcpnp_score_case_id_bcpnp_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_score" ADD CONSTRAINT "bcpnp_score_computed_by_user_id_fk" FOREIGN KEY ("computed_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bcpnp_business_concept_case_version_uq" ON "dashboard"."bcpnp_business_concept" USING btree ("case_id","version");--> statement-breakpoint
CREATE INDEX "bcpnp_business_concept_case_idx" ON "dashboard"."bcpnp_business_concept" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "bcpnp_case_applicant_idx" ON "dashboard"."bcpnp_case" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "bcpnp_case_superuser_idx" ON "dashboard"."bcpnp_case" USING btree ("superuser_id");--> statement-breakpoint
CREATE INDEX "bcpnp_case_stage_status_idx" ON "dashboard"."bcpnp_case" USING btree ("stage","status");--> statement-breakpoint
CREATE UNIQUE INDEX "bcpnp_case_event_case_key_uq" ON "dashboard"."bcpnp_case_event" USING btree ("case_id","event_key");--> statement-breakpoint
CREATE INDEX "bcpnp_case_event_case_idx" ON "dashboard"."bcpnp_case_event" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "bcpnp_deadline_case_idx" ON "dashboard"."bcpnp_deadline" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "bcpnp_deadline_due_status_idx" ON "dashboard"."bcpnp_deadline" USING btree ("due_at","status");--> statement-breakpoint
CREATE INDEX "bcpnp_document_case_idx" ON "dashboard"."bcpnp_document" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "bcpnp_document_case_category_idx" ON "dashboard"."bcpnp_document" USING btree ("case_id","category");--> statement-breakpoint
CREATE INDEX "bcpnp_document_share_document_idx" ON "dashboard"."bcpnp_document_share" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "bcpnp_engagement_case_idx" ON "dashboard"."bcpnp_engagement" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "bcpnp_engagement_partner_idx" ON "dashboard"."bcpnp_engagement" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "bcpnp_family_member_case_idx" ON "dashboard"."bcpnp_family_member" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "bcpnp_investment_line_concept_idx" ON "dashboard"."bcpnp_investment_line" USING btree ("concept_id");--> statement-breakpoint
CREATE INDEX "bcpnp_job_plan_concept_idx" ON "dashboard"."bcpnp_job_plan" USING btree ("concept_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bcpnp_rule_edition_stream_key_uq" ON "dashboard"."bcpnp_rule" USING btree ("edition_id","stream","key");--> statement-breakpoint
CREATE INDEX "bcpnp_rule_edition_idx" ON "dashboard"."bcpnp_rule" USING btree ("edition_id");--> statement-breakpoint
CREATE INDEX "bcpnp_score_case_idx" ON "dashboard"."bcpnp_score" USING btree ("case_id");