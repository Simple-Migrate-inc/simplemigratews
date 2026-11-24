# Global Partner Program — Integration Notes

**Author:** Phase 0 audit — Claude Code  
**Date:** 2026-11-24  
**Status:** Plan — stop for review before writing any product code

---

## 1. What exists (reuse these)

### 1.1 Framework & routing
- **Public site:** Next.js Pages Router (`src/pages/`) — all public pages live here
- **Dashboard:** App Router (`src/app/app/`) — all gated product screens live here
- Tailwind 3.2.4 with `tw-` prefix; dual CSS pipelines must stay separate
- `@dashboard-ui/*` path alias for dashboard UI components (Card, Table, PageHeader, Field, etc.)

### 1.2 Auth
- Better Auth 1.7 — invitation-only, DB sessions (12 h), TOTP MFA enforced for non-candidates
- `requireUser({ area })` / `getCurrentUser()` reads role fresh from DB on every request
- Current `user_role` enum: `candidate | consultant | admin | partner | agent | superuser`
- `partner_manager` role (new, required by this module) needs an **additive enum migration**

### 1.3 ORM & migrations
- Drizzle ORM 0.45.4 + drizzle-kit 0.31.11, `postgres.js` driver
- All tables in the `dashboard` Postgres schema
- 4 migrations shipped (0000–0003); next is **0004**
- Migrations are generated with drizzle-kit and applied explicitly — never on deploy
- Production DB: Supabase on `ca-central-1` ✓ (Canadian data residency)

### 1.4 Existing partner tables (do not break these)
The original schema (migration 0000) has:
- `partner` — old case-management partners: `lender | lawyer | accountant | broker` type, provinces, languages, licence numbers
- `partner_member` — links a user to a `partner` org (no tier, no type)
- `consent_grant` — candidate-approved scoped expiring grant (shared by partner + agent referrals)
- `referral` — a referred case linked to a `partner` + `consent_grant`

These are **live and in use** by the existing `/app/partner` dashboard.

### 1.5 PNP-specific partner tables (migration 0003, also live)
- `bcpnp_partner_org` — BC PNP partner orgs
- `bcpnp_partner_member` — BC PNP members with tier (`org_admin | l3 | l2 | l1 | mk`)
- `bcpnp_assignment`, `bcpnp_consent` — PNP-scoped assignment/consent

These are **BC PNP-only** and must not be reused for the global partner program.

### 1.6 PNP `can()` helper (reusable pattern, not reusable directly)
`src/lib/pnp/permissions.ts` — pure function, no DB calls, pre-fetched actor context passed in. The global partner module gets a **sibling** at `src/lib/partners/permissions.ts` following the same pattern.

### 1.7 Email
Resend via `sendEmail()` in `src/lib/dashboard/email/`; `log` driver for local dev. Reuse as-is.

### 1.8 Audit log
`src/lib/dashboard/audit/` — append-only `audit_event` table; a DB trigger blocks UPDATE/DELETE/TRUNCATE. Reuse as-is for all partner events.

### 1.9 Storage
`src/lib/dashboard/storage/` — `local` or `s3` driver. Reuse for agreement PDFs, brand kit assets, receipt blobs.

---

## 2. Naming decisions

### 2.1 Table prefix
Existing naming creates a collision risk:

| Prefix | Scope |
|---|---|
| `partner_*` (no prefix) | Old case-management partners (live) |
| `bcpnp_partner_*` | BC PNP partner sub-system (live) |
| **`gp_*`** | **Global Partner Program (new)** |

New tables will use the `gp_` prefix throughout (e.g., `gp_org`, `gp_member`, `gp_referral`, `gp_commission_ledger`). This avoids all collisions.

### 2.2 Portal route
The prompt specifies `/portal/*`. In this repo all dashboard routes are under `/app/*`. The portal will live at **`/app/portal/*`** (App Router, `src/app/app/(shell)/portal/`). The public-facing apply form is at **`/partners/apply`** (Pages Router, `src/pages/partners/apply.tsx`).

### 2.3 `partner_manager` role
Added to `user_role` enum via migration 0004. Staff role — not a client role. MFA-required. Home route: `/app/admin/partners`. Superuser can still do everything a partner_manager can plus approvals and commission rule edits.

### 2.4 Public `/partners` page
Lives in `src/pages/partners/index.tsx` (Pages Router), consistent with all other public pages (`canada-immigration.tsx`, etc.). Static/ISR. Layout: `Layout01` (header + footer). Not in App Router.

### 2.5 Per-country variants
Route: `src/pages/partners/[country].tsx`. Shares the same container/data shape; country-specific copy overrides a base object. Build this stub in Phase 1 (page renders with the same content; country-specific override is a data concern, not a routing one).

---

## 3. New tables (migration 0004+)

### Core org / membership
| Table | Notes |
|---|---|
| `gp_org` | Replaces nothing. Stores type, tier, status, agreement fields, KYC refs |
| `gp_member` | user_id → gp_org_id, role (`org_admin | member`), active |
| `gp_partner_arrangement` | Per-org regulatory flags: `regulator_permits_referral_fee`, `cicc_agent_registration_verified_at` |

### Application pipeline
| Table | Notes |
|---|---|
| `gp_application` | Full fields from §3 of prompt; `auto_score int`, status enum |
| `gp_kyc` | Principal ID, business reg, beneficial owners, sanctions, risk rating |
| `gp_agreement` | Signed agreement + CoC + DPA, esign provider ref |

### Tiers & commission configuration
| Table | Notes |
|---|---|
| `gp_tier_history` | tier, effective_from, reason (`auto | manual`), metrics_snapshot jsonb |
| `gp_tier_rule` | Superuser-editable: min_paid_clients, min_sourced_revenue_minor, currency, rate_bps, perks jsonb |
| `gp_service_code` | code, name, commissionable bool, category |
| `gp_commission_rule` | Most-specific-wins: org_id nullable, service_code nullable, tier nullable, rate_bps, effective dates |

### Referrals & attribution
| Table | Notes |
|---|---|
| `gp_referral` | lead_email, lead_name, channel, campaign_code, attribution_status, attribution_expires_at |
| `gp_referral_click` | ip_hash, ua_hash, campaign_code, landing_path (cookie id stored client-side) |

### Client stages
| Table | Notes |
|---|---|
| `gp_stage_definition` | stage_key, internal_label, partner_label, order, is_commission_event |
| `gp_client_stage` | client_user_id, stage_key, at, actor_id, source |

### Collaboration
| Table | Notes |
|---|---|
| `gp_collab_request` | type, from/to, subject, status, consent_id nullable |
| `gp_collab_event` | request_id, actor_id, action, note, at |

### Commission & payouts
| Table | Notes |
|---|---|
| `gp_commission_ledger` | referral_id, invoice_id, invoice_line_id, service_code, base_amount_minor, rate_bps, amount_minor, currency, status, kind |
| `gp_payout` | org_id, period, total_minor, currency, fx_rate, provider, status |
| `gp_payout_method` | org_id, provider, provider_account_ref, currency, verified_at |
| `gp_dispute` | org_id, referral_id/ledger_id, reason, status, decision |

### Engagement & marketing
| Table | Notes |
|---|---|
| `gp_partner_health` | org_id, week, score, components jsonb |
| `gp_academy_course` | level, title, content_ref, pass_score |
| `gp_academy_progress` | member_id, course_id, score, completed_at |
| `gp_co_marketing_claim` | org_id, quarter, amount_minor, description, status |
| `gp_landing_page` | org_id, slug, headline, body, status, compliance_flags jsonb |
| `gp_message_thread` | org_id, client_user_id nullable |
| `gp_message` | thread_id, author_id, body, created_at |

**Money invariant:** all amount columns are `integer` minor units + ISO currency text. Never `numeric` or `float`. Rounding to minor units follows the provider's FX rate. 

---

## 4. Adapter interfaces (pilot implementations)

All live behind `src/lib/integrations/` interfaces. Pilot starts with manual/stub adapters; vendor can change without touching business logic.

| Adapter | Interface | Pilot implementation |
|---|---|---|
| `CrmAdapter` | `pushContact()`, `pushDeal()`, `lookupByEmail()` | `StubCrmAdapter` (logs to console + DB table); **HubSpot not set up** — no env vars exist |
| `BillingAdapter` | `verifyWebhookSignature()`, `parseInvoicePaidEvent()` | `StubBillingAdapter` (manual test endpoint); no Stripe/QBO integration exists |
| `PayoutAdapter` | `send()`, `onboardOrg()` | `ManualPayoutAdapter` (CSV export); live: Stripe Connect or Wise Business (choose by INR/AED coverage) |
| `EsignAdapter` | `sendEnvelope()`, `verifyWebhookSignature()` | `ManualEsignAdapter` (upload signed PDF) |
| `KycAdapter` | `screenEntity()`, `screenPrincipal()` | `ManualKycAdapter` (staff marks as checked); live: Complyadvantage or Acuris |
| `NotifyAdapter` | `send(channel, userId, event, payload)` | Wraps existing `sendEmail()`; interface ready for WhatsApp |

---

## 5. Compliance rules enforced in code

These are not copy — they are runtime guards:

| Rule | Enforcement point |
|---|---|
| Non-commissionable invoice lines never create a ledger row | `processInvoicePaid()` checks `gp_service_code.commissionable` before inserting |
| `licensed_immigration` earns no commission unless `cicc_agent_registration_verified_at` is set | `processInvoicePaid()` checks `gp_partner_arrangement` |
| `professional` earns no commission unless `regulator_permits_referral_fee` is true | Same check |
| Commission never links to outcome (nomination/visa) | `gp_stage_definition.is_commission_event = false` for `submitted` and `decision_received` stages; enforced by DB constraint |
| Marketing partners see only partner-label stages, never scores/documents/net worth/outcome detail | Serializer layer in portal APIs (`src/app/api/portal/`); leak tests in Phase 2 |
| Ambassador override is one level only | `processInvoicePaid()` checks ambassador chain depth (max 1); never inserts a second-level row |
| "Guaranteed visa/PR/nomination" language blocks landing page publish | `scanForGuaranteeLanguage()` before setting `status = published` |
| CASL: marketing consent checkbox starts unticked | HTML `defaultChecked={false}`, server action validates the separate consent flag |
| Attribution locked at `first_invoice_paid`; only Superuser may change | Server action checks role before updating `attribution_status` |

---

## 6. Open questions (stop-and-ask items)

| # | Question | Impact |
|---|---|---|
| 1 | **HubSpot account:** does one exist? Phase 1 uses a stub — but we need the meeting URL (`NEXT_PUBLIC_PARTNER_MEETING_URL`) now for the apply form CTA. | Phase 1 public page |
| 2 | **Billing system:** Stripe, QuickBooks, or something else? This determines how `BillingAdapter` is wired. Commission engine is blocked on this. | Phase 4 |
| 3 | **Payout vendor:** Stripe Connect vs Wise Business. Both support CAD→INR. Wise has better AED support. Decision needed before Phase 4 live payout adapter. | Phase 4 |
| 4 | **E-sign vendor:** Dropbox Sign vs DocuSign. Both have Canadian data residency options. | Phase 1 (pilot: manual upload) |
| 5 | **KYC screening vendor:** Complyadvantage or Acuris are common. Pilot is manual. | Phase 1 (pilot: manual) |
| 6 | **Agreement text:** The partner agreement, code of conduct and DPA must be drafted by counsel before Phase 1 ships the e-sign step. What we build in Phase 1 is the manual-upload placeholder; the final text is a legal deliverable. | Phase 1 approval flow |
| 7 | **`partner_manager` role login:** Should partner managers also use the existing `/app/admin` dashboard shell, or get their own area? Proposal: same shell, `canEnterArea` updated to allow partner_manager → `/app/admin/partners`. | Phase 1 role addition |
| 8 | **Existing `partner` table fate:** Old lender/lawyer partners (migration 0000) still use `role = "partner"` and `/app/partner` home. The global program partners also use `role = "partner"`. These share a home route today. Proposal: redirect global-program partners (those with a `gp_member` row) to `/app/portal`; old partners (those with a `partner_member` row) go to `/app/partner` as today. | Phase 2 gating |
| 9 | **Academy content:** The module can build the course schema and progress tracking now. Actual course content (videos, quizzes) is an editorial deliverable. Phase 5 builds the structure; content is a separate workstream. | Phase 5 |
| 10 | **Wave 1 country list:** Prompt says Canada/BC + India. Confirm this is correct so we can seed `gp_stage_definition` and configure the auto-score function. | Phase 1 seed |

---

## 7. Routing summary

| URL | Router | File | Auth |
|---|---|---|---|
| `/partners` | Pages | `src/pages/partners/index.tsx` | None — public |
| `/partners/[country]` | Pages | `src/pages/partners/[country].tsx` | None — public |
| `/partners/apply` | Pages | `src/pages/partners/apply.tsx` | None — public |
| `/app/portal` | App | `src/app/app/(shell)/portal/page.tsx` | `gp_member` with signed agreement + KYC |
| `/app/portal/refer` | App | `src/app/app/(shell)/portal/refer/page.tsx` | Same |
| `/app/portal/clients` | App | `src/app/app/(shell)/portal/clients/...` | Same |
| `/app/portal/commissions` | App | `src/app/app/(shell)/portal/commissions/...` | Same |
| `/app/portal/payouts` | App | `src/app/app/(shell)/portal/payouts/...` | Same |
| `/app/portal/marketing` | App | `src/app/app/(shell)/portal/marketing/...` | Same |
| `/app/portal/academy` | App | `src/app/app/(shell)/portal/academy/...` | Level 1 required after onboard |
| `/app/portal/team` | App | `src/app/app/(shell)/portal/team/page.tsx` | `org_admin` only |
| `/app/admin/partners` | App | `src/app/app/(shell)/admin/partners/...` | `admin | superuser | partner_manager` |

---

## 8. Phase plan

**Phase 1 — Data, roles, public page, application pipeline**
- Migration 0004: `partner_manager` role, `gp_*` tables (orgs, members, applications, KYC stub, arrangements, tier rules, service codes, stage definitions), seed data
- `src/lib/partners/permissions.ts` — `canPartner(actor, action)` with full matrix tests
- `/partners` public page (static, all sections from §4; no testimonials; placeholder portal screenshots)
- `/partners/apply` server action — create application, auto-score, `StubCrmAdapter.pushContact()`, confirmation email
- Admin pipeline `/app/admin/partners/applications` — kanban + table, screen → meeting → KYC → approve/decline
- `StubEsignAdapter` — admin uploads signed PDF; org created on receipt
- Partner manager role wired into `canEnterArea`

**Phase 2 — Portal MVP + attribution**
- Portal shell and gating (`gp_member` + signed agreement + KYC)
- Home, Refer, My Clients (stage timeline, partner labels only), Messages, Team, Support
- Referral links + cookie (`sm_ref`, 180 days) + `gp_referral_click` + signup attribution flow
- Client consent flow (in-app + email prompt → `gp_collab_request` with consent_id)
- Stage mapping from PNP `bcpnp_case.workbook_status` → `gp_client_stage`
- **Serializer-level data-leak tests:** portal APIs must never expose scores, documents, net worth, or outcome detail to marketing-type partners

**Phase 3 — Collaboration requests**
- Full `gp_collab_request` lifecycle, all types from §9
- Consent prompt bridges to PNP `bcpnp_assignment` + `section_grants` for professional/licensed partners
- Escalation job (5 business-day SLA, creates task + flags in admin)

**Phase 4 — Commission engine + payouts**
- `lib/commissions/engine.ts` — pure function; `processInvoicePaid()`, `processRefund()`, `releaseHoldbacks()`, `runTierRecalculation()`
- Billing webhook endpoint (signature-verified, idempotent on `invoice_line_id`)
- Ambassador override (one-level cap, enforced in engine)
- Monthly payout draft generation, `ManualPayoutAdapter` CSV; then live adapter
- Commission rule editor in admin
- All §8 table-driven tests pass

**Phase 5 — Engagement**
- Nightly tier job with downgrade guard (at most one tier down per quarter)
- Academy (Level 1 required gate); health score (weekly job); win-back automation (90/180/365-day)
- Marketing hub: brand kit, landing page builder + compliance scan, social post library, campaign analytics
- Co-marketing claims (Gold+)
- Notifications channel abstraction (email now, WhatsApp interface later)

**Phase 6 — Admin KPIs, hardening, pilot**
- KPI dashboard (all metrics from §10)
- Security pass: IDOR across orgs, consent bypass, attribution cookie tampering, webhook spoofing, HTML injection in landing pages
- Accessibility on `/partners` and portal
- Pilot seed: 1 RCIC firm, 1 accounting firm, 3–5 India-based marketing partners, 1 test ambassador

---

## 9. What does NOT change

- Existing public pages, layouts, global CSS, fonts, colours, copy (the only public change is adding a "Partners" nav item + footer link to `src/data/menu.ts` and footer data)
- Existing `partner` / `partner_member` / `consent_grant` / `referral` tables — untouched
- PNP Workbook module — no changes; only stage events bridge into `gp_client_stage`
- Existing `user_role` enum values — `partner_manager` is **added**, nothing removed
