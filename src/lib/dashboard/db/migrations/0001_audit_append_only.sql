-- Audit events are append-only: reject any UPDATE or DELETE at the database
-- level so no code path (or manual query) can rewrite history.
CREATE OR REPLACE FUNCTION "dashboard"."audit_event_immutable"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'dashboard.audit_event is append-only (% rejected)', TG_OP;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "audit_event_no_update_delete"
    BEFORE UPDATE OR DELETE ON "dashboard"."audit_event"
    FOR EACH ROW EXECUTE FUNCTION "dashboard"."audit_event_immutable"();
--> statement-breakpoint
CREATE TRIGGER "audit_event_no_truncate"
    BEFORE TRUNCATE ON "dashboard"."audit_event"
    FOR EACH STATEMENT EXECUTE FUNCTION "dashboard"."audit_event_immutable"();
