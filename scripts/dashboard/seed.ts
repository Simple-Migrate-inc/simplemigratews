/**
 * Local/preview seed for the Readiness Dashboard. All people, firms,
 * businesses and listings are fictional sample data (example.com).
 *
 *   npm run db:seed
 *
 * Refuses to run when NODE_ENV=production or when the dashboard already has
 * users. Rule catalogue entries were checked against official sources on the
 * seed date but MUST be re-verified before launch.
 */
import { randomUUID } from "crypto";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashPassword } from "better-auth/crypto";
import * as s from "../../src/lib/dashboard/db/schema";
import { REQUIRED_CONSENTS } from "../../src/lib/dashboard/auth/legal";

config({ path: [".env.local", ".env"] });

const SEED_DATE = new Date("2026-10-14T00:00:00Z");
const PASSWORD = process.env.SEED_PASSWORD || "SimpleMigrate-dev-2026";
const REVERIFY = "Seeded 2026-10-14 from the official source. Must be re-verified before launch.";

async function main() {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production.");
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");

    const client = postgres(url, { max: 1 });
    const db = drizzle(client, { schema: s });

    const existing = await db.select({ id: s.user.id }).from(s.user).limit(1);
    if (existing.length) {
        console.log("Dashboard already has users — skipping seed. Run `npm run db:reset` for a fresh local DB.");
        await client.end();
        return;
    }

    const hash = await hashPassword(PASSWORD);

    // ── Users ──────────────────────────────────────────────────────────────
    type Seed = { key: string; name: string; email: string; role: s.UserRole; extra?: Partial<typeof s.user.$inferInsert> };
    const people: Seed[] = [
        { key: "admin", name: "Avery Admin", email: "admin@example.com", role: "admin" },
        {
            key: "consultant",
            name: "Jordan Lee, RCIC",
            email: "consultant@example.com",
            role: "consultant",
            extra: { licenceBody: "CICC", licenceNumber: "R000000 (sample)", licenceVerifiedAt: SEED_DATE },
        },
        { key: "candidate", name: "Sam Rivera", email: "candidate@example.com", role: "candidate" },
        { key: "lender", name: "Priya Shah", email: "lender@example.com", role: "partner" },
        { key: "lawyer", name: "Daniel Okafor", email: "lawyer@example.com", role: "partner" },
        { key: "agentCommercial", name: "Morgan Chen", email: "agent.commercial@example.com", role: "agent" },
        { key: "agentResidential", name: "Taylor Singh", email: "agent.residential@example.com", role: "agent" },
    ];
    const ids: Record<string, string> = {};
    for (const p of people) {
        const id = randomUUID();
        ids[p.key] = id;
        await db.insert(s.user).values({ id, name: p.name, email: p.email, role: p.role, emailVerified: true, ...p.extra });
        await db.insert(s.account).values({ id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: hash });
        await db.insert(s.consentRecord).values(
            REQUIRED_CONSENTS.map((c) => ({ userId: id, kind: c.kind, version: c.version, wording: c.wording }))
        );
    }

    // ── Cohort, case, partners ─────────────────────────────────────────────
    const [cohort] = await db
        .insert(s.cohort)
        .values({ name: "BC Pilot — Cohort 1", startDate: SEED_DATE, notes: "Phase 1 concierge pilot (sample)." })
        .returning();
    await db.insert(s.dashCase).values({
        candidateId: ids.candidate,
        consultantId: ids.consultant,
        cohortId: cohort.id,
        stage: "intake_in_progress",
        journeyType: "buy",
        targetProvinces: ["BC"],
        budgetBand: "CAD 500k–1M",
    });

    const [lender, lawyer] = await db
        .insert(s.partner)
        .values([
            {
                firm: "Example Credit Union — Business Lending",
                type: "lender",
                provinces: ["BC"],
                languages: ["English", "Punjabi", "Hindi"],
                feeDisclosureText: "Simple Migrate receives no fee from this lender for referrals during the pilot. (Sample)",
            },
            {
                firm: "Example Law LLP",
                type: "lawyer",
                provinces: ["BC"],
                languages: ["English", "French"],
                licenceNumbers: { lsbc: "sample" },
                feeDisclosureText: "Simple Migrate receives no fee from this firm for referrals during the pilot. (Sample)",
            },
        ])
        .returning();
    await db.insert(s.partnerMember).values([
        { partnerId: lender.id, userId: ids.lender },
        { partnerId: lawyer.id, userId: ids.lawyer },
    ]);

    // ── Businesses with labelled claims ────────────────────────────────────
    const businesses = [
        { displayName: "Okanagan café with drive-through", municipality: "Kelowna", naics: "722512", priceBand: "CAD 400k–600k", revenueBand: "CAD 700k–900k", staffCount: 9 },
        { displayName: "Interior BC motel (22 rooms)", municipality: "Kamloops", naics: "721111", priceBand: "CAD 1.5M–2M", revenueBand: "CAD 600k–800k", staffCount: 6 },
        { displayName: "Vancouver Island child care centre", municipality: "Nanaimo", naics: "624410", priceBand: "CAD 600k–800k", revenueBand: "CAD 900k–1.1M", staffCount: 12 },
        { displayName: "Northern BC auto repair shop", municipality: "Prince George", naics: "811111", priceBand: "CAD 300k–500k", revenueBand: "CAD 800k–1M", staffCount: 5 },
        { displayName: "Fraser Valley specialty food manufacturer", municipality: "Abbotsford", naics: "311990", priceBand: "CAD 900k–1.2M", revenueBand: "CAD 1.5M–2M", staffCount: 14 },
    ];
    const bizRows = await db
        .insert(s.business)
        .values(businesses.map((b) => ({ ...b, province: "BC", source: "Sample data", sponsored: false })))
        .returning();
    const claim = (businessId: string, claimText: string, value: string, evidenceLabel: (typeof s.evidenceLabel.enumValues)[number]) => ({
        businessId,
        claim: claimText,
        value,
        evidenceLabel,
        sourceRef: evidenceLabel === "seller_provided" ? "Seller information memorandum (sample)" : evidenceLabel === "public_record" ? "BC Registry (sample)" : "Broker estimate (sample)",
        checkedAt: evidenceLabel === "independently_checked" ? SEED_DATE : null,
        checkedBy: evidenceLabel === "independently_checked" ? ids.consultant : null,
    });
    await db.insert(s.businessClaim).values(
        bizRows.flatMap((b, i) => [
            claim(b.id, "Annual revenue (last fiscal year)", businesses[i].revenueBand, "seller_provided"),
            claim(b.id, "Years in operation", `${8 + i * 3}`, "public_record"),
            claim(b.id, "Owner hours per week", `${40 + i * 5}`, "estimate"),
            ...(i === 0 ? [claim(b.id, "Lease term remaining", "6 years + 5-year option", "independently_checked")] : []),
        ])
    );

    // ── Rule catalogue ─────────────────────────────────────────────────────
    await db.insert(s.ruleCatalogEntry).values([
        {
            kind: "immigration_pathway",
            name: "BC PNP Entrepreneur Immigration — Base",
            jurisdiction: "CA-BC",
            status: "open",
            summary: "Provincial nomination stream for experienced entrepreneurs establishing or buying a business in B.C.",
            keyThresholds: { personalNetWorthCad: 600000, minInvestmentCad: 200000, minOwnershipPct: 33.33, note: "Thresholds as published; confirm current figures." },
            sourceUrl: "https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration",
            lastVerifiedAt: SEED_DATE,
            ownerId: ids.admin,
            verificationNote: REVERIFY,
        },
        {
            kind: "immigration_pathway",
            name: "BC PNP Entrepreneur Immigration — Regional",
            jurisdiction: "CA-BC",
            status: "open",
            summary: "Stream for entrepreneurs establishing a business in a participating smaller B.C. community.",
            keyThresholds: { personalNetWorthCad: 300000, minInvestmentCad: 100000, note: "Thresholds as published; confirm current figures and participating communities." },
            sourceUrl: "https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration",
            lastVerifiedAt: SEED_DATE,
            ownerId: ids.admin,
            verificationNote: REVERIFY,
        },
        {
            kind: "immigration_pathway",
            name: "Start-up Visa Program",
            jurisdiction: "CA",
            status: "paused",
            summary: "Federal program for founders with support from a designated organization. Not accepting new applications; a replacement pilot has been announced without details.",
            sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/news/notices/immigration-measures-entrepreneurs.html",
            lastVerifiedAt: SEED_DATE,
            ownerId: ids.admin,
            verificationNote: REVERIFY,
        },
        {
            kind: "property_restriction",
            name: "Prohibition on the Purchase of Residential Property by Non-Canadians Act",
            jurisdiction: "CA",
            status: "in_force",
            summary:
                "Federal restriction on non-Canadians buying residential property (buildings with three or fewer dwelling units, including condominium units) in census metropolitan areas and census agglomerations, with exemptions. Extended to January 1, 2027; the federal government is reviewing it.",
            appliesWhen: { propertyTypes: ["residential"], maxUnits: 3, inCensusMetroOrAgglomeration: true },
            effectiveUntil: new Date("2027-01-01T00:00:00-05:00"),
            sourceUrl: "https://laws-lois.justice.gc.ca/eng/acts/P-25.2/page-1.html",
            lastVerifiedAt: SEED_DATE,
            ownerId: ids.admin,
            verificationNote: `${REVERIFY} Status after January 1, 2027 depends on federal decision.`,
        },
        {
            kind: "property_tax",
            name: "B.C. additional property transfer tax (foreign buyers)",
            jurisdiction: "CA-BC",
            status: "in_force",
            summary:
                "Foreign nationals, foreign corporations and taxable trustees pay an additional 20% property transfer tax on their share of residential property in specified areas of B.C.",
            appliesWhen: {
                province: "BC",
                propertyTypes: ["residential", "business_with_property"],
                specifiedAreas: ["Greater Vancouver", "Fraser Valley", "Capital", "Central Okanagan", "Nanaimo"],
            },
            sourceUrl: "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/property-transfer-tax/additional-property-transfer-tax",
            lastVerifiedAt: SEED_DATE,
            ownerId: ids.admin,
            verificationNote: `${REVERIFY} Confirm the current rate and the list of specified areas.`,
        },
    ]);

    // ── Brokerage, agents, listings ────────────────────────────────────────
    const [brokerage] = await db
        .insert(s.brokerage)
        .values({
            name: "Example Realty Ltd. (sample)",
            regulator: "BCFSA",
            licenceNumber: "SAMPLE-0001",
            province: "BC",
            officeAddress: "Kelowna, BC",
            verifiedAt: SEED_DATE,
            feedAgreement: { source: "agent_upload", scope: "Listings this brokerage is authorized to market", signedAt: "2026-10-14", expiresAt: "2027-10-14" },
        })
        .returning();
    const reverifyDueAt = new Date("2027-10-14T00:00:00Z");
    const [agentC, agentR] = await db
        .insert(s.agent)
        .values([
            {
                userId: ids.agentCommercial,
                brokerageId: brokerage.id,
                regulator: "BCFSA",
                licenceNumber: "SAMPLE-C-100",
                licenceClass: "Representative — Trading Services",
                provinces: ["BC"],
                languages: ["English", "Mandarin"],
                specialties: ["commercial", "industrial", "land", "business_with_property"],
                verifiedAt: SEED_DATE,
                verificationSource: "BCFSA public licensee search (sample record)",
                reverifyDueAt,
                status: "verified",
            },
            {
                userId: ids.agentResidential,
                brokerageId: brokerage.id,
                regulator: "BCFSA",
                licenceNumber: "SAMPLE-R-200",
                licenceClass: "Representative — Trading Services",
                provinces: ["BC"],
                languages: ["English", "Punjabi"],
                specialties: ["residential"],
                verifiedAt: SEED_DATE,
                verificationSource: "BCFSA public licensee search (sample record)",
                reverifyDueAt,
                status: "verified",
            },
        ])
        .returning();

    const attribution = "Listed by Example Realty Ltd. (sample data for local development — not a real listing).";
    type L = typeof s.propertyListing.$inferInsert;
    const base = (n: number, over: Omit<L, "source" | "sourceListingId" | "attributionText">): L => ({
        source: "agent_upload",
        sourceListingId: `SAMPLE-${String(n).padStart(3, "0")}`,
        brokerageId: brokerage.id,
        attributionText: attribution,
        lastSyncedAt: SEED_DATE,
        ...over,
    });
    await db.insert(s.propertyListing).values([
        base(1, { listingAgentId: agentC.id, propertyType: "commercial", transaction: "lease", leaseRate: "CAD 28/sq ft/yr (triple net)", province: "BC", municipality: "Kelowna", cmaName: "Kelowna", addressDisplayLevel: "street", address: "Harvey Ave, Kelowna", lat: 49.8845, lng: -119.4795, sizeSqft: 2400, zoning: "C4", title: "Street-front commercial unit on Harvey Ave" }),
        base(2, { listingAgentId: agentC.id, propertyType: "commercial", transaction: "sale", price: "1350000", province: "BC", municipality: "Kamloops", cmaName: "Kamloops", addressDisplayLevel: "area", lat: 50.6745, lng: -120.3273, sizeSqft: 5200, zoning: "C2", title: "Two-storey office/commercial building" }),
        base(3, { listingAgentId: agentC.id, propertyType: "retail", transaction: "lease", leaseRate: "CAD 34/sq ft/yr", province: "BC", municipality: "Victoria", cmaName: "Victoria", addressDisplayLevel: "street", address: "Fort St, Victoria", lat: 48.4248, lng: -123.3612, sizeSqft: 1300, zoning: "CA-4", title: "Downtown retail space with storefront" }),
        base(4, { listingAgentId: agentC.id, propertyType: "retail", transaction: "sale", price: "780000", province: "BC", municipality: "Penticton", cmaName: "Penticton", addressDisplayLevel: "area", lat: 49.4991, lng: -119.5937, sizeSqft: 1900, zoning: "C5", title: "Strata retail unit near Main St" }),
        base(5, { listingAgentId: agentC.id, propertyType: "land", transaction: "sale", price: "520000", province: "BC", municipality: "Regional District of Nanaimo", addressDisplayLevel: "area", lat: 49.2, lng: -124.1, sizeSqft: 217800, zoning: "Rural (RU1)", title: "5-acre rural parcel with highway access" }),
        base(6, { listingAgentId: agentC.id, propertyType: "business_with_property", transaction: "sale", price: "1850000", province: "BC", municipality: "Kamloops", cmaName: "Kamloops", addressDisplayLevel: "area", lat: 50.7, lng: -120.35, sizeSqft: 9800, units: 22, zoning: "C3", linkedBusinessId: bizRows[1].id, title: "22-room motel — business and real estate" }),
        base(7, { listingAgentId: agentR.id, propertyType: "residential", transaction: "sale", price: "1190000", province: "BC", municipality: "Surrey", cmaName: "Vancouver", addressDisplayLevel: "area", lat: 49.1913, lng: -122.849, sizeSqft: 2100, units: 1, zoning: "RF", title: "Family home, 4 bed, near schools" }),
        base(8, { listingAgentId: agentR.id, propertyType: "residential", transaction: "lease", leaseRate: "CAD 2,650/month", province: "BC", municipality: "Golden", cmaName: null, addressDisplayLevel: "area", lat: 51.2975, lng: -116.9631, sizeSqft: 1100, units: 1, zoning: "R1", title: "3-bed rental townhouse" }),
    ]);

    await client.end();
    console.log("\nSeeded the dashboard with sample data. Sign in at http://localhost:3000/app/login");
    console.log(`Password for every seeded account: ${PASSWORD}\n`);
    for (const p of people) console.log(`  ${p.role.padEnd(10)} ${p.email}`);
    console.log("\nStaff, partner and agent accounts must set up an authenticator app on first sign-in");
    console.log("(set DASH_DEV_SKIP_MFA=true in .env.local to skip that locally).");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
