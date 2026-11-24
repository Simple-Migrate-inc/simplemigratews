CREATE TYPE "dashboard"."bcpnp_partner_tier" AS ENUM('org_admin', 'l3', 'l2', 'l1', 'mk');--> statement-breakpoint
CREATE TYPE "dashboard"."bcpnp_workbook_status" AS ENUM('draft', 'ready_to_register', 'registered', 'invited', 'closed');--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"section_grants" text[],
	"expires_at" timestamp with time zone,
	"granted_by" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bcpnp_campaign_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"scope" text DEFAULT 'full_file' NOT NULL,
	"given_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_partner_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"tier" "dashboard"."bcpnp_partner_tier" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_partner_org" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"country" text DEFAULT 'CA' NOT NULL,
	"licence_no" text,
	"licence_verified_at" timestamp with time zone,
	"verified_by" text,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard"."bcpnp_status_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"from_status" "dashboard"."bcpnp_workbook_status",
	"to_status" "dashboard"."bcpnp_workbook_status" NOT NULL,
	"actor_id" text NOT NULL,
	"payload" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD COLUMN "workbook_status" "dashboard"."bcpnp_workbook_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_case" ADD COLUMN "campaign_code" text;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_community" ADD COLUMN "economic_region" text;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_community" ADD COLUMN "regional_district" text;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_community" ADD COLUMN "pause_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_community" ADD COLUMN "source_updated_at" date;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_assignment" ADD CONSTRAINT "bcpnp_assignment_file_id_bcpnp_case_id_fk" FOREIGN KEY ("file_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_assignment" ADD CONSTRAINT "bcpnp_assignment_member_id_bcpnp_partner_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "dashboard"."bcpnp_partner_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_assignment" ADD CONSTRAINT "bcpnp_assignment_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_assignment" ADD CONSTRAINT "bcpnp_assignment_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_campaign" ADD CONSTRAINT "bcpnp_campaign_member_id_bcpnp_partner_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "dashboard"."bcpnp_partner_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_consent" ADD CONSTRAINT "bcpnp_consent_file_id_bcpnp_case_id_fk" FOREIGN KEY ("file_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_consent" ADD CONSTRAINT "bcpnp_consent_org_id_bcpnp_partner_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."bcpnp_partner_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_partner_member" ADD CONSTRAINT "bcpnp_partner_member_org_id_bcpnp_partner_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "dashboard"."bcpnp_partner_org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_partner_member" ADD CONSTRAINT "bcpnp_partner_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_partner_org" ADD CONSTRAINT "bcpnp_partner_org_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_status_event" ADD CONSTRAINT "bcpnp_status_event_file_id_bcpnp_case_id_fk" FOREIGN KEY ("file_id") REFERENCES "dashboard"."bcpnp_case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard"."bcpnp_status_event" ADD CONSTRAINT "bcpnp_status_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "dashboard"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bcpnp_assignment_file_idx" ON "dashboard"."bcpnp_assignment" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "bcpnp_assignment_member_idx" ON "dashboard"."bcpnp_assignment" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "bcpnp_campaign_member_idx" ON "dashboard"."bcpnp_campaign" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bcpnp_consent_file_org_uq" ON "dashboard"."bcpnp_consent" USING btree ("file_id","org_id");--> statement-breakpoint
CREATE INDEX "bcpnp_consent_file_idx" ON "dashboard"."bcpnp_consent" USING btree ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bcpnp_partner_member_org_user_uq" ON "dashboard"."bcpnp_partner_member" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "bcpnp_partner_member_user_idx" ON "dashboard"."bcpnp_partner_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bcpnp_partner_member_org_idx" ON "dashboard"."bcpnp_partner_member" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "bcpnp_status_event_file_idx" ON "dashboard"."bcpnp_status_event" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "bcpnp_status_event_at_idx" ON "dashboard"."bcpnp_status_event" USING btree ("at");--> statement-breakpoint
CREATE INDEX "bcpnp_case_workbook_status_idx" ON "dashboard"."bcpnp_case" USING btree ("workbook_status");