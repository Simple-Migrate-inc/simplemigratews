# Simple Migrate — website + Readiness Dashboard

This repo is the live **public marketing site** (Next.js Pages Router, a customised "MaxCoach" theme) plus the **Readiness Dashboard**, an invitation-only product under `/app` (Next.js App Router). The full product spec is the "Simple Migrate Readiness Dashboard (MVP)" master prompt; build it phase by phase (A → F), one PR per phase.

## Non-negotiables

1. **The public site must not change.** Don't edit existing pages, layouts, shared components, global CSS, Tailwind design values, fonts, colours or copy. The only public change made so far is the "Client login" item in `src/data/menu.ts`. `npm run test:visual` must pass at zero pixel tolerance; if it fails, find out why before you ever run `--update-snapshots`.
2. **Reuse, don't replace.** The dashboard reuses the site's tokens, logo and `@ui/*` components (Button, Input). New UI goes in `src/components/dashboard/`. To vary a shared component, wrap it; never edit the original.
3. **Database changes are additive only.** Everything lives in the `dashboard` Postgres schema. Never drop or rename a shipped column or table. Migrations are generated with drizzle-kit, reviewed, and applied explicitly (`npm run db:migrate`); they never run automatically on deploy.
4. **Isolation.** Dashboard routes live under `src/app/app/*`. Public builds must not depend on dashboard code, and the CSS pipelines are separate (see "Styling" below).
5. **No secrets in code.** Use env vars, documented in `.env.example`. They're parsed in `src/lib/dashboard/env.ts`.
6. **Authorization is server-side on every request.** Each page and server action calls `requireUser()`. Case data is opened through `openCase()`, which checks role + assignment + consent grant and writes an audit event. Never rely on middleware or layouts alone.
7. **Product rules.** No eligibility verdicts or outcome promises anywhere. Show `<InfoNotice />` on readiness, shortlist and pathway screens. Every pathway shows its status, source link and last-verified date. Listings come only from authorized sources (never scrape REALTOR.ca/MLS®). `FEATURE_AGENT_REFERRAL_FEES` stays off until counsel approves.
8. Ask before destructive actions, auth changes for existing users, major dependency upgrades, or touching existing data.

## Commands

```bash
npm run dev            # dashboard CSS is built once first; run `npm run dev:css` alongside to watch it
npm run build          # prebuild compiles dashboard CSS; postbuild writes the sitemap
npm run typecheck && npm run lint && npm test
npm run test:visual    # public-site pixel guard (Playwright, needs `npm run build` first)
npm run test:e2e       # all e2e; resets + seeds the simplemigrate_test DB
npm run db:generate -- --name <change>   # after editing src/lib/dashboard/db/schema.ts
npm run db:migrate
npm run db:seed        # sample data; prints the shared dev password
npm run db:reset       # LOCAL ONLY: drop dashboard schema, migrate, seed
```

Local setup: Postgres on localhost with databases `simplemigrate_dev` and `simplemigrate_test`, and `.env.local` copied from `.env.example`.

## Folder map

```
src/pages/, containers/, layouts/, components/ (except dashboard/)   public site — do not modify
src/data/menu.ts                         public nav (has the "Client login" item)
src/app/layout.tsx                       App Router root (dashboard only)
src/app/app/login, invite/[token], setup-mfa, consent    unauthenticated or gated screens
src/app/app/(shell)/...                  role areas: page.tsx (candidate), consultant/, admin/, partner/, agent/, account/
src/app/api/auth/[...all]/route.ts       Better Auth handler (public sign-up blocked)
src/middleware.ts                        /app/* only: session-cookie check + security headers
src/components/dashboard/                dashboard UI (shell, cards, tables, fields)
src/lib/dashboard/
  env.ts  db/ (schema.ts, migrations/, index.ts)  auth/ (auth, session, roles, access, case-access, invitations, legal)
  audit/  email/  cases.ts  format.ts  rules/  ai/  storage/  listings/  (later phases)
scripts/dashboard/                       migrate, seed, reset-local, build-css
e2e/                                     Playwright: public-visual, dashboard-auth, dashboard-mobile
```

## Styling (important)

- Tailwind uses the `tw-` prefix. **Class names must live in `.tsx` files**: both Tailwind and the site's PurgeCSS only scan `*.tsx`.
- The public CSS is built by Next from `src/assets/css/tailwind.css` with `tailwind.config.js`, whose `content` deliberately excludes `src/app/**` and `src/components/dashboard/**`. PurgeCSS skips them too (`postcss.config.js`).
- The dashboard CSS is compiled separately by the Tailwind CLI (`npm run dashboard:css`), from `src/app/styles/dashboard.src.css` with `tailwind.dashboard.config.js` (which uses the site config as a preset), into `dashboard.generated.css` (gitignored and wrapped in purgecss-ignore comments). Don't use `@config` inside Next's pipeline: on Tailwind 3.2 two configs in one build cross-contaminate and break the public CSS.
- Font Awesome 5 **Free** only: use `fas` (solid) icons; most `far` icons don't exist. The dashboard has its own copy at `src/app/font-awesome.css`.

## Auth

- Better Auth 1.7 (chosen over Auth.js v5, which is still beta and can't pair credentials with DB sessions). Email + password, magic link, DB sessions (12h), TOTP MFA.
- Accounts are invitation-only: `createInvitation` → single-use link (7 days) → `acceptInvitation` records the exact consent wording. A DB hook refuses to create any user without an open invitation.
- MFA is mandatory for consultant, admin, partner and agent. `requireUser()` redirects to `/app/setup-mfa`.
- Suspending a user deletes their sessions immediately. Role and status are always read from the DB, never trusted from the cookie.
- `dashboard.audit_event` is append-only; a DB trigger rejects UPDATE, DELETE and TRUNCATE.
