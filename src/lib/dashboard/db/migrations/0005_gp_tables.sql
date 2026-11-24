CREATE TYPE "dashboard"."gp_application_status" AS ENUM('applied', 'screening', 'meeting_scheduled', 'due_diligence', 'approved', 'waitlisted', 'declined');--> statement-breakpoint
CREATE TYPE "dashboard"."gp_collab_type" AS ENUM('join_client_file', 'introduce_specialist', 'document_needed', 'co_marketing', 'deal_opportunity', 'attribution_dispute');--> statement-breakpoint
CREATE TYPE "dashboard"."gp_member_role" AS ENUM('org_admin', 'member');--> statement-breakpoint
CREATE TYPE "dashboard"."gp_org_status" AS ENUM('pending', 'active', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "dashboard"."gp_org_type" AS ENUM('marketing', 'professional', 'licensed_immigration', 'strategic', 'ambassador');--> statement-breakpoint
CREATE TYPE "dashboard"."gp_tier" AS ENUM('registered', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TABLE "dashboard"."gp_agreement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"agreement_version" text NOT NULL,
	"code_of_conduct_version" text NOT NULL,
	"dpa_version" text NOT NULL,
	"signed_at" timestamp with time zone,
	"signer_user_id" text,
	"esign_provider_ref" text,
	"doc_blob_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company" text NOT NULL,
	"website" text,
	"socials" jsonb,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"type" "dashboard"."gp_org_type" NOT NULL,
	"segments" text[] DEFAULT '{}'::text[] NOT NULL,
	"est_referrals_per_qtr" integer DEFAULT 0 NOT NULL,
	"licence_no" text,
	"heard_from" text,
	"utm" jsonb,
	"auto_score" integer DEFAULT 0 NOT NULL,
	"status" "dashboard"."gp_application_status" DEFAULT 'applied' NOT NULL,
	"decline_reason_code" text,
	"meeting_at" timestamp with time zone,
	"reviewed_by" text,
	"conduct_accepted_at" timestamp with time zone,
	"privacy_accepted_at" timestamp with time zone,
	"casl_marketing_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_client_stage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_user_id" text NOT NULL,
	"stage_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_id" text,
	"source" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_commission_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"service_code" text,
	"tier" "dashboard"."gp_tier",
	"rate_bps" integer NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"principal_id_verified_at" timestamp with time zone,
	"business_reg_no" text,
	"beneficial_owners" jsonb,
	"sanctions_checked_at" timestamp with time zone,
	"sanctions_result" text,
	"adverse_media_result" text,
	"tax_profile" jsonb,
	"risk_rating" text,
	"next_review_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gp_kyc_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "dashboard"."gp_member_role" DEFAULT 'member' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_org" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "dashboard"."gp_org_type" NOT NULL,
	"status" "dashboard"."gp_org_status" DEFAULT 'pending' NOT NULL,
	"tier" "dashboard"."gp_tier" DEFAULT 'registered' NOT NULL,
	"application_id" uuid,
	"manager_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_partner_arrangement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"regulator_permits_referral_fee" boolean DEFAULT false NOT NULL,
	"cicc_agent_registration_verified_at" timestamp with time zone,
	"verified_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gp_partner_arrangement_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_service_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"commissionable" boolean DEFAULT true NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gp_service_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_stage_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_key" text NOT NULL,
	"internal_label" text NOT NULL,
	"partner_label" text NOT NULL,
	"sort_order" integer NOT NULL,
	"is_commission_event" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gp_stage_definition_stage_key_unique" UNIQUE("stage_key")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_tier_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"tier" "dashboard"."gp_tier" NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"reason" text DEFAULT 'auto' NOT NULL,
	"metrics_snapshot" jsonb,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."gp_tier_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" "dashboard"."gp_tier" NOT NULL,
	"min_paid_clients" integer DEFAULT 0 NOT NULL,
	"min_sourced_revenue_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"rate_bps" integer NOT NULL,
	"perks" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gp_tier_rule_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
ALTER TABLE "dashboard"."gp_agreement" ADD CONSTRAINT "gp_agreement_org_id_gp_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."gp_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_agreement" ADD CONSTRAINT "gp_agreement_signer_user_id_user_id_fk" FOREIGN KEY ("signer_user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_application" ADD CONSTRAINT "gp_application_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_client_stage" ADD CONSTRAINT "gp_client_stage_client_user_id_user_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_client_stage" ADD CONSTRAINT "gp_client_stage_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_commission_rule" ADD CONSTRAINT "gp_commission_rule_org_id_gp_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."gp_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_kyc" ADD CONSTRAINT "gp_kyc_org_id_gp_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."gp_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_kyc" ADD CONSTRAINT "gp_kyc_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_member" ADD CONSTRAINT "gp_member_org_id_gp_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."gp_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_member" ADD CONSTRAINT "gp_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_org" ADD CONSTRAINT "gp_org_application_id_gp_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "dashboard"."gp_application"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_org" ADD CONSTRAINT "gp_org_manager_user_id_user_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_partner_arrangement" ADD CONSTRAINT "gp_partner_arrangement_org_id_gp_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."gp_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_partner_arrangement" ADD CONSTRAINT "gp_partner_arrangement_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_tier_history" ADD CONSTRAINT "gp_tier_history_org_id_gp_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."gp_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."gp_tier_history" ADD CONSTRAINT "gp_tier_history_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gp_client_stage_user_idx" ON "dashboard"."gp_client_stage" USING btree ("client_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gp_member_uq" ON "dashboard"."gp_member" USING btree ("org_id","user_id");