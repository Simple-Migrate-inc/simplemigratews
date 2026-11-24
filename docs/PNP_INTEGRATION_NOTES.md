# PNP Workbook Integration Notes

**Author:** Phase 0 audit — Claude Code  
**Date:** 2026-11-23  
**Status:** Plan — stop for review before writing any product code

---

## 1. What exists (reuse these)

### 1.1 Framework & routing
- Next.js 14.2, TypeScript 5.9
- **Hybrid routing:** Pages Router (`src/pages/`) for public site; App Router (`src/app/app/`) for dashboard
- Tailwind 3.2.4 with `tw-` class prefix; dual CSS pipelines (site vs dashboard — do not merge)
- `@dashboard-ui/*` path aliases for existing UI components (Card, Button, Input, Table, PageHeader, StatusPill, InfoNotice, Field, etc.)

### 1.2 Auth
- **Better Auth 1.7** — email/password + magic link, DB sessions (12 h), TOTP MFA
- Invitation-only sign-up enforced at the DB level
- `requireUser({ area })` / `getCurrentUser()` — reads role + status fresh from DB on every request; never trusts cookie
- `user_role` enum: `candidate | consultant | admin | partner | agent | superuser`
- MFA mandatory for all roles except `candidate`
- `mfaRequiredInThisEnv()` / `DASH_ALLOW_NO_MFA_IN_PRODUCTION` safety valve (documented in CLAUDE.md)

### 1.3 ORM & migrations
- Drizzle ORM 0.45.4 + drizzle-kit 0.31.11
- `postgres.js` driver; `dashboard` Postgres schema
- **3 migrations shipped** (0000 init, 0001 audit append-only, 0002 bcpnp_foundation)
- Never drop/rename shipped columns — additive only

### 1.4 Existing BCPNP tables (migration 0002)
All prefixed `bcpnp_` in the `dashboard` schema. **These are live and must not be altered destructively.**

| Table | Contents |
|---|---|
| `bcpnp_guide_edition` | Rule version (like `scoring_rules_versions` in prompt) |
| `bcpnp_rule` | Key/value rules per edition + stream |
| `bcpnp_case` | Main case — applicant, consultant, stream, stage, status, community |
| `bcpnp_applicant_profile` | Flat columns for eligibility inputs (partial — covers Module 2–5 lightly) |
| `bcpnp_business_concept` | Concept scoring inputs (Module 6) |
| `bcpnp_score` | Computed score sections (self-declared + concept range) |
| `bcpnp_community` | 18 RIC communities — missing `pause_until`, `source_updated_at`, `economic_region`, `regional_district` |
| `bcpnp_investment_line` | Investment items (Module 7) |
| `bcpnp_job_plan` | Job positions (Module 8) |
| `bcpnp_document` | Uploaded files (Module 9) |
| `bcpnp_document_share` | Document sharing |
| `bcpnp_deadline` / `bcpnp_case_event` | Deadline engine |
| `bcpnp_engagement` | Partner attached to a case |
| `bcpnp_family_member` | Family/marital data (Module 1 partial) |

### 1.5 Existing BCPNP business logic
Pure functions (no DB, no I/O) — already correctly separated:

| File | Lines | Coverage |
|---|---|---|
| `lib/dashboard/bcpnp/eligibility.ts` | 423 | Minimum thresholds check; CLB 4 test; experience path; go/no-go for Base and Regional |
| `lib/dashboard/bcpnp/score.ts` | 147 | Section max tables; self-declared total + concept range |
| `lib/dashboard/bcpnp/concept.ts` | 280 | Concept scoring grid helpers |
| `lib/dashboard/bcpnp/deadlines.ts` | 200 | Deadline offset calculations |
| `lib/dashboard/bcpnp/rules.ts` | 48 | `loadRules()` — DB query returning a `RuleMap` |
| `lib/dashboard/bcpnp/seed-rules.ts` | 161 | May 27, 2024 rule constants (Base + Regional pool minimums, experience thresholds, investment/ownership floors) |

**Gap:** The scoring engine has section _maxes_ and eligibility checks, but not the full per-answer point tables (education brackets, age brackets, language CLB-to-points mapping, adaptability detail) that the reference workbook computes. These need to be extracted from `reference/bcpnp-score-workbook.html` in Phase 2.

### 1.6 Existing BCPNP UI
| Path | Role | Status |
|---|---|---|
| `/app/superuser/bcpnp` | Superuser | Pipeline list ✓ |
| `/app/superuser/bcpnp/new` | Superuser | Create case ✓ |
| `/app/superuser/bcpnp/[caseId]` | Superuser | Case detail ✓ |
| `/app/superuser/bcpnp/communities` | Superuser | Community list ✓ |
| `/app/superuser/bcpnp/rules` | Superuser | Rule versions ✓ |
| `/app/superuser/bcpnp/actions.ts` | Superuser | Server actions: create case, deadlines ✓ |
| `/app/app/(shell)/bcpnp/[caseId]` | Candidate | Case home (stage tracker + upcoming deadlines) ✓ |

### 1.7 Access control (current)
`lib/dashboard/bcpnp/access.ts` — `openBcpnpCase()` grants superuser/admin full access; consultant only their assigned cases; candidate only their own. **No section-level grants, no partner orgs, no tier model yet.**

### 1.8 Storage
- `STORAGE_DRIVER=local` (dev) or `s3` (prod)
- `S3_REGION` defaults to `ca-central-1` ✓ — Canadian data residency for blobs is already wired
- Signed-URL generation via `src/lib/dashboard/storage/`

### 1.9 AI
- `ANTHROPIC_API_KEY` env var present
- `FEATURE_AI` DB flag
- Existing `aiRun` table in `schema.ts` for the Readiness Dashboard (not BCPNP)
- **Missing:** `ANTHROPIC_MODEL` env var, `bcpnp_ai_draft` table, usage quotas

### 1.10 Tests
- Vitest for unit; Playwright for e2e + visual
- Existing BCPNP unit tests: `concept.test.ts`, `score.test.ts`, `eligibility.test.ts`, `deadlines.test.ts`
- `e2e/public-visual.spec.ts` — zero-tolerance pixel guard (must keep passing)

### 1.11 Feature flag
`bcpnp_cases` flag in `dashboard.feature_flag` table (off by default). `requireBcpnp()` enforces it on every BCPNP page.

---

## 2. What needs to be added

### 2.1 Partner org & tier model (Phase 1)

The prompt's partner hierarchy (Org Admin / L3 / L2 / L1 / MK) doesn't exist. The existing `user_role` has a flat `partner` role; sub-tiers need to live in a new table.

**New tables (migration 0003):**

```
bcpnp_partner_org     — org record (name, type, country, licence_no, verified_at, verified_by)
bcpnp_partner_member  — org_id, user_id, tier(org_admin|l3|l2|l1|mk), active
bcpnp_assignment      — file_id, member_id, section_grants text[], expires_at, granted_by, revoked_at
bcpnp_consent         — file_id, org_id, scope, given_at, withdrawn_at
bcpnp_campaign        — member_id, code, name (marketing attribution)
```

**Existing `user_role` stays unchanged.** All workbook partner users get `role = "partner"` in the user table; their tier comes from `bcpnp_partner_member`. This avoids widening the core role enum.

### 2.2 Workbook section answers (Phase 2)

The current `bcpnp_applicant_profile` stores flat columns. The full workbook has 10 modules with complex nested answers. We need:

```
bcpnp_section  — file_id, section_key, data jsonb (Zod-validated), version, updated_by, updated_at
                 unique(file_id, section_key)
```

**`bcpnp_applicant_profile` stays.** It drives the existing deadline engine and eligibility check. `bcpnp_section` stores the richer workbook answers in parallel. The two can be kept in sync by the save path (write section → recompute profile columns if needed).

**Section keys:** `registrant | experience | net_worth | adaptability | language | community_referral | concept | investment | jobs | attachments`

### 2.3 Repeating experience roles

`bcpnp_applicant_profile` stores aggregate month counts. The full workbook has repeating roles with 6-digit NAICS, ownership %, and date ranges. Need:

```
bcpnp_experience_role  — file_id, title, employer, naics, ownership_pct, is_owner_manager,
                         is_senior_manager, months_10y, months_5y, start_date, end_date
```

### 2.4 Community data gaps

`bcpnp_community` missing columns:
- `pause_until` (timestamptz) — Campbell River and Comox pauses from workbook seed
- `source_updated_at` (date) — "last checked" date shown to applicants
- `economic_region` (text)
- `regional_district` (text)

### 2.5 Case lifecycle status

The prompt's `draft → ready_to_register → registered → invited → closed` is a **pre-BC-PNP workbook status**, separate from the existing `bcpnp_case_stage` (which tracks the BC PNP process journey after registration). Need:

```
bcpnp_workbook_status enum  — draft | ready_to_register | registered | invited | closed
```

Add `workbook_status` column to `bcpnp_case` (additive). The existing `stage` column remains for BC PNP process tracking.

```
bcpnp_status_event  — file_id, from_status, to_status, actor_id, payload jsonb (bc_pnp_file_no, dates, reason), at
```

### 2.6 Score snapshots and breakdown

Extend `bcpnp_score` with:
- `breakdown jsonb` — per-section detail for display
- `rules_edition_id uuid` FK (already has the right FK hook from `bcpnp_guide_edition`)
- `is_snapshot boolean` — pinned on status transitions

Or add a separate `bcpnp_score_snapshot` to avoid mutating the live row. Prefer separate table (additive, non-destructive).

### 2.7 Case attribution (marketing)

Add to `bcpnp_case`:
- `source_partner_id uuid` FK → `bcpnp_partner_member`
- `campaign_code text`

Attribution is immutable after set (only Superuser can change).

### 2.8 AI drafts + usage

```
bcpnp_ai_draft  — file_id, section_key, action, input_hash, output jsonb, model, input_tokens,
                  output_tokens, accepted_by, accepted_at
bcpnp_ai_usage  — org_id, user_id, year_month, tokens
```

### 2.9 Comments and tasks

```
bcpnp_comment  — file_id, section_key, author_id, body, resolved_at
bcpnp_task     — file_id, section_key, assignee_id, body, due_date, done_at
```

### 2.10 Permissions helper

`lib/pnp/permissions.ts` — `can(user, partnerMember | null, action, fileId?, sectionKey?)` returning boolean. One source of truth for every route, server action and AI route.

### 2.11 Scoring engine extraction

Move and expand scoring to `lib/pnp-scoring/` (pure TS):
- Reuse existing logic from `lib/dashboard/bcpnp/score.ts`, `eligibility.ts`, `concept.ts`
- Add full per-answer point tables extracted from `reference/bcpnp-score-workbook.html`
- Parameterise on `RuleMap` so old snapshots stay reproducible

### 2.12 Env additions

Add to `env.ts`:
- `ANTHROPIC_MODEL` — model name (default `claude-sonnet-4-6`)
- `FEATURE_PNP_WORKBOOK` — bool flag distinct from `bcpnp_cases` (workbook is opt-in per org)

---

## 3. Naming convention decision

The prompt uses `pnp_*` table names; the codebase uses `bcpnp_*`. **Keep `bcpnp_*` throughout** to stay consistent with migration 0002, existing code, and audit log event strings. All new tables follow the same prefix.

---

## 4. Mapping prompt → repo

| Prompt name | Repo name | Action |
|---|---|---|
| `partner_orgs` | `bcpnp_partner_org` | NEW |
| `partner_members` | `bcpnp_partner_member` | NEW |
| `pnp_files` | `bcpnp_case` | EXTEND (add `workbook_status`, `source_partner_id`, `campaign_code`) |
| `pnp_sections` | `bcpnp_section` | NEW |
| `pnp_experience_roles` | `bcpnp_experience_role` | NEW |
| `pnp_investment_items` | `bcpnp_investment_line` | EXTEND (exists) |
| `pnp_jobs` | `bcpnp_job_plan` | EXTEND (exists) |
| `pnp_attachments` | `bcpnp_document` | EXTEND (exists) |
| `pnp_assignments` | `bcpnp_assignment` | NEW |
| `pnp_consents` | `bcpnp_consent` | NEW |
| `pnp_scores` | `bcpnp_score` + `bcpnp_score_snapshot` | EXTEND + NEW |
| `pnp_status_events` | `bcpnp_status_event` | NEW |
| `pnp_comments` | `bcpnp_comment` | NEW |
| `pnp_tasks` | `bcpnp_task` | NEW |
| `scoring_rules_versions` | `bcpnp_guide_edition` + `bcpnp_rule` | REUSE (exists) |
| `ric_communities` | `bcpnp_community` | EXTEND (add 4 columns) |
| `ric_priority_naics` | `bcpnp_community.naics_priorities` array | EXTEND (or new join table if per-community priority order needed) |
| `marketing_campaigns` | `bcpnp_campaign` | NEW |
| `ai_drafts` | `bcpnp_ai_draft` | NEW |
| `ai_usage` | `bcpnp_ai_usage` | NEW |
| `audit_log` | `audit_event` | REUSE — existing append-only table with DB trigger |
| `lib/pnp/permissions.ts` | `lib/pnp/permissions.ts` | NEW |
| `lib/pnp-scoring/` | `lib/pnp-scoring/` | NEW — extract from existing `lib/dashboard/bcpnp/` |

---

## 5. Data residency risk

- **Blob storage:** S3 `ca-central-1` ✓ — already set
- **Database:** The connection URL cleaner handles Neon/Supabase URLs; the actual region is set by whoever provisioned the database. **This must be confirmed before any real client files are stored.** Action: check the DB host in `.env.local` / Vercel env and confirm it resolves to a Canadian region (Neon: `ca-central-1`, Supabase: `ca-central-1 Montreal`, etc.). If it's US, we stop and pick a Canadian plan before Phase 1 ships client data.

---

## 6. Conflicts with the prompt

| Item | Prompt says | Repo has | Decision |
|---|---|---|---|
| Table prefix | `pnp_*` | `bcpnp_*` | Keep `bcpnp_*` |
| Partner tier storage | tier enum on `partner_members` | No tier field anywhere | Add `bcpnp_partner_member.tier` enum |
| File lifecycle | 5 statuses (draft→closed) | 10-stage `bcpnp_case_stage` for BC PNP process | Add `workbook_status` column; keep `stage` |
| Scoring engine | `lib/pnp-scoring/` | In `lib/dashboard/bcpnp/` | Create new package, move + extend |
| AI model env | `ANTHROPIC_MODEL` | Not in `env.ts` | Add it |
| `DASH_ALLOW_NO_MFA_IN_PRODUCTION` | Not mentioned | Exists (temporary demo switch) | Leave as-is; don't break |

---

## 7. What needs the reference HTML first (blockers)

Before Phase 2 can begin:

1. **`reference/bcpnp-score-workbook.html`** must be placed in the repo.  
   → Extract it from the artifact menu (Download / Export file), drop it at that path, commit it.

2. **Golden-master test fixtures** (cases 1–5 from the prompt) can only be verified by running the reference workbook headlessly and capturing its output. Playwright/jsdom script will be written in Phase 2 against the actual file.

3. **Full per-answer scoring tables** (education CLB brackets, age points, adaptability detail for all tabs) come from the reference HTML, not from memory.

---

## 8. Phase plan

### Phase 1 — Access foundation (migration 0003)

**New tables:** `bcpnp_partner_org`, `bcpnp_partner_member` (with `mk` tier), `bcpnp_assignment`, `bcpnp_consent`, `bcpnp_campaign`  
**Extend:** `bcpnp_case` (+`workbook_status`, +`source_partner_id`, +`campaign_code`), `bcpnp_community` (+4 columns)  
**New enum:** `bcpnp_partner_tier`, `bcpnp_workbook_status`  
**New code:** `lib/pnp/permissions.ts` with `can()` and full matrix; update `openBcpnpCase()` to handle partner access; middleware/server-action helpers  
**Tests:** Matrix unit tests; L1/MK can't read Net worth; L2 blocked on ungranted sections; expired/revoked assignments fail; cross-firm 404

**Acceptance:** All matrix unit tests pass. No change to existing UI.

### Phase 2 — Port the workbook (migration 0004)

**Requires:** `reference/bcpnp-score-workbook.html` in repo  
**New tables:** `bcpnp_section`, `bcpnp_experience_role`, `bcpnp_status_event`, `bcpnp_score_snapshot`  
**New code:**  
- `lib/pnp-scoring/` — extract + expand scoring engine from existing files; add full per-answer point tables from reference HTML  
- Zod schemas for all 10 section keys  
- Autosave API routes with `version` conflict detection  
- Golden-master test harness: run reference HTML headlessly → capture → save as expected fixtures  
- Seed `bcpnp_community` with all 18 RIC communities + `pause_until` / `source_updated_at`; flag Campbell River and Comox pauses in seed output for Superuser review  
**Tests:** All 5 fixture cases match reference workbook exactly. Forms round-trip. `localStorage` gone.

### Phase 3 — Role screens

**Superuser:** PNP dashboard (filters, draw-range alert, expiring referrals), assignment manager, partner org/licence verification, reference data editor, marketing overview, audit viewer, view-as  
**Org Admin / L3 / L2:** My applicants, scoped workbook (10 tabs, locked/visible per grants), Compare both, Ways to raise, comments and tasks, Request access, Team page  
**L1:** Referrals board + "Refer an applicant" form  
**MK:** Marketing dashboard (campaign links, funnel, sourced leads — no PII)  
**Applicant:** Guided intake (tabs 1–5, 7–9), My score (full + "estimate" label), What's missing, Sharing/consent  
**Autosave:** debounced 800 ms, optimistic, version-conflict dialog

### Phase 4 — Claude features

Route `app/api/pnp/ai/[action]/route.ts`  
Actions: `draft-concept`, `revise-to-grid`, `coverage-check`, `ways-to-raise`, `advisor-chat`  
Context builder (`lib/pnp/ai/context.ts`) — filters to caller's visible sections before prompt  
`bcpnp_ai_draft` save + pending-edit apply flow  
`bcpnp_ai_usage` quotas  
**Tests:** Context builder never includes sections the caller can't view.

### Phase 5 — Exports and import

`.md` registration export (same as workbook), PDF summary, workbook JSON import (bring in `localStorage` exports from the reference HTML tool)

### Phase 6 — Hardening and pilot

IDOR tests, signed-URL leak test, prompt injection via CV text, mass-assignment on JSONB  
Autosave load test  
Accessibility check on intake  
Pilot seed: 1 RCIC firm (Org Admin + L3), 1 accounting firm (L2), 1 marketing partner (MK)  
Full end-to-end: MK ref link → applicant self-signup → Superuser triage → assign L3 + L2 → intake → score → Ready → Registered

---

## 9. Open questions (need answers before / during Phase 1)

1. **DB region:** What is the actual Postgres host in production? Confirm it's in Canada before storing client data.
2. **Virus scanning:** The prompt requires virus scan on upload. The existing `bcpnp_document.scan_status` column is there but no scanner is wired. Options: AWS VirusTotal Lambda trigger on S3, Cloudmersive API, or ClamAV sidecar. Which is preferred?
3. **Invitation flow for partner orgs:** How do new L3/L2/L1/MK users get invited? Same `createInvitation` flow with `partnerId` → `bcpnp_partner_member` row? Or a separate org-admin invite UI? (Preference: reuse existing invitation system, add `partner_member_tier` to invitation payload.)
4. **MFA for L1/MK:** The prompt says MFA is mandatory for consultant, admin, partner, agent. All workbook partners get `role = "partner"`, so MFA applies. L1 referrals get the same requirement — confirm this is acceptable for a realtor who logs in once a month.
5. **Campbell River / Comox pauses:** Workbook seed has these paused. Pauses may have expired (the prompt says "flag for Superuser review, don't silently drop"). Should the seed print a console warning, or create a Superuser-visible notification row?
6. **Priority NAICS per community:** The workbook has a table of community → priority NAICS codes. Currently stored as `text[]` in `bcpnp_community.naics_priorities`. If the priority order matters (top 3 vs rest), we need a separate join table. Does order matter for scoring?
7. **`ANTHROPIC_MODEL` default:** Use `claude-sonnet-4-6` as default? Confirm.
8. **Referral 90-day window:** Confirm the current guide still specifies 90 days (not changed since May 27, 2024).

---

## 10. What we will NOT change

- `src/pages/`, `containers/`, `layouts/`, `components/` (except `components/dashboard/`) — public site is untouched
- Global CSS, Tailwind config, design tokens, fonts, colours
- `src/data/menu.ts` beyond the already-added "Client login" item
- Existing schema columns (additive only)
- Better Auth configuration
- The `partner`, `partnerMember`, `consentGrant`, `referral` tables in `schema.ts` — those are the Readiness Dashboard real estate/lending partner model, separate from BCPNP workbook partners
