import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import SEO from "@components/seo/page-seo";
import Layout from "@layout/layout-01";
import Breadcrumb from "@components/breadcrumb";
import Anchor from "@ui/anchor";

type PageProps = NextPage & {
    Layout: typeof Layout;
};

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Global Partner Program — Simple Migrate",
    description:
        "Join the Simple Migrate Global Partner Network. Refer clients, earn transparent commissions, and help entrepreneurs move their businesses and lives across borders.",
    url: "https://www.simplemigrate.com/partners",
    publisher: {
        "@type": "Organization",
        name: "Simple Migrate Inc.",
        url: "https://www.simplemigrate.com",
    },
};

// ─── Static content ───────────────────────────────────────────────────────────

const PARTNER_TYPES = [
    {
        type: "Marketing Partners",
        icon: "fas fa-bullhorn",
        description:
            "Bloggers, content creators, and media organisations with audiences of aspiring entrepreneurs and immigrants.",
    },
    {
        type: "Professional Partners",
        icon: "fas fa-briefcase",
        description:
            "Accountants, wealth managers, HR consultants, and other advisors who serve globally mobile professionals.",
    },
    {
        type: "Strategic Partners",
        icon: "fas fa-handshake",
        description:
            "Chambers of commerce, business associations, government bodies, and ecosystem enablers.",
    },
    {
        type: "Ambassador Partners",
        icon: "fas fa-user-tie",
        description:
            "Respected individuals with deep community trust who champion Simple Migrate within their networks.",
    },
];

const HOW_IT_WORKS = [
    {
        step: "1",
        title: "Apply online",
        body: "Complete our short application. Our team reviews within five business days.",
    },
    {
        step: "2",
        title: "Discovery call",
        body: "We schedule a 30-minute call to understand your network and answer your questions.",
    },
    {
        step: "3",
        title: "Agreement & onboarding",
        body: "Sign the partner agreement, complete onboarding, and get access to your partner portal.",
    },
    {
        step: "4",
        title: "Refer and earn",
        body: "Share your referral link. Track client progress transparently in your partner dashboard.",
    },
];

const TIERS = [
    {
        tier: "Registered",
        bps: "5 %",
        requirement: "No minimum",
        perks: "Portal access, referral tracking",
    },
    {
        tier: "Silver",
        bps: "6.5 %",
        requirement: "3 paid clients",
        perks: "Silver badge, priority email support",
    },
    {
        tier: "Gold",
        bps: "8 %",
        requirement: "10 paid clients",
        perks: "Gold badge, priority phone support",
    },
    {
        tier: "Platinum",
        bps: "10 %",
        requirement: "25 paid clients",
        perks: "Dedicated partner manager, co-marketing opportunities",
    },
];

const FAQS = [
    {
        q: "Who can become a partner?",
        a: "Any individual, agency, or organisation outside of Canada that works with entrepreneurs, investors, or internationally mobile professionals. We review every application individually.",
    },
    {
        q: "How are commissions calculated?",
        a: "Commissions are a percentage of the service fees Simple Migrate earns from clients you refer — never from government fees, legal representation costs, or any pass-through charges.",
    },
    {
        q: "Is there a cost to join?",
        a: "No. The partner programme is free to join at the Registered tier.",
    },
    {
        q: "How quickly are commissions paid?",
        a: "Commissions are calculated monthly and paid within 30 days of month-end, once a client has completed their first paid milestone.",
    },
    {
        q: "Do RCIC or immigration lawyers earn referral commissions?",
        a: "No. Licensed immigration professionals cannot receive referral fees under CICC and law society rules, so this programme is not available to them in that capacity.",
    },
    {
        q: "How do I track the clients I refer?",
        a: "Your partner portal shows stage milestones for each referred client using plain-language labels — for example 'Engaged' or 'Successful outcome'. Internal immigration details remain confidential.",
    },
];

// ─── Page component ───────────────────────────────────────────────────────────

const PartnersPage: PageProps = () => {
    return (
        <>
            <Head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </Head>
            <SEO
                title="Global Partner Program"
                description="Join the Simple Migrate Global Partner Network. Refer clients, earn transparent commissions, and help entrepreneurs relocate their businesses across borders."
            />
            <Breadcrumb
                pages={[{ path: "/", label: "home" }]}
                currentPage="Partner Program"
                showTitle={false}
            />

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section className="tw-py-20 tw-bg-light-100">
                <div className="tw-container tw-text-center">
                    <h1 className="tw-text-4xl md:tw-text-5xl tw-font-bold tw-mb-5 tw-text-heading">
                        Grow together — globally
                    </h1>
                    <p className="tw-text-lg tw-text-body tw-max-w-2xl tw-mx-auto tw-mb-9">
                        Simple Migrate helps entrepreneurs buy businesses and
                        relocate across borders. As a partner, you connect your
                        network to that journey — and earn transparent
                        commissions when clients succeed.
                    </p>
                    <Anchor
                        path="/partners/apply"
                        className="tw-btn tw-btn-primary tw-inline-block tw-px-8 tw-py-3 tw-rounded-sm tw-font-semibold tw-text-white tw-bg-primary hover:tw-bg-primary-dark tw-transition-colors"
                    >
                        Apply now — it&rsquo;s free
                    </Anchor>
                </div>
            </section>

            {/* ── Why partner ───────────────────────────────────────────── */}
            <section className="tw-py-16">
                <div className="tw-container">
                    <h2 className="tw-text-3xl tw-font-bold tw-text-heading tw-mb-10 tw-text-center">
                        Why partner with Simple Migrate?
                    </h2>
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-8">
                        <div className="tw-p-6 tw-border tw-border-gray-200 tw-rounded-sm">
                            <div className="tw-mb-4 tw-text-primary tw-text-3xl">
                                <i className="fas fa-dollar-sign" />
                            </div>
                            <h3 className="tw-font-semibold tw-text-heading tw-mb-2">
                                Transparent commissions
                            </h3>
                            <p className="tw-text-body tw-text-sm">
                                Every commissionable service, rate, and payment
                                date is documented before you sign. No
                                surprises.
                            </p>
                        </div>
                        <div className="tw-p-6 tw-border tw-border-gray-200 tw-rounded-sm">
                            <div className="tw-mb-4 tw-text-primary tw-text-3xl">
                                <i className="fas fa-chart-line" />
                            </div>
                            <h3 className="tw-font-semibold tw-text-heading tw-mb-2">
                                Real-time tracking
                            </h3>
                            <p className="tw-text-body tw-text-sm">
                                Your partner dashboard shows milestone
                                progress for every referred client, so you
                                always know where things stand.
                            </p>
                        </div>
                        <div className="tw-p-6 tw-border tw-border-gray-200 tw-rounded-sm">
                            <div className="tw-mb-4 tw-text-primary tw-text-3xl">
                                <i className="fas fa-shield-alt" />
                            </div>
                            <h3 className="tw-font-semibold tw-text-heading tw-mb-2">
                                Compliance-first
                            </h3>
                            <p className="tw-text-body tw-text-sm">
                                We work within Canadian immigration and
                                consumer-protection rules so your reputation
                                stays safe.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Partner types ─────────────────────────────────────────── */}
            <section className="tw-py-16 tw-bg-light-100">
                <div className="tw-container">
                    <h2 className="tw-text-3xl tw-font-bold tw-text-heading tw-mb-10 tw-text-center">
                        Who is this for?
                    </h2>
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-7">
                        {PARTNER_TYPES.map(({ type, icon, description }) => (
                            <div
                                key={type}
                                className="tw-bg-white tw-p-6 tw-rounded-sm tw-shadow-sm"
                            >
                                <div className="tw-text-primary tw-text-3xl tw-mb-4">
                                    <i className={icon} />
                                </div>
                                <h3 className="tw-font-semibold tw-text-heading tw-mb-2">
                                    {type}
                                </h3>
                                <p className="tw-text-body tw-text-sm">
                                    {description}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className="tw-text-center tw-text-sm tw-text-body tw-mt-6">
                        Not sure which type fits? Select the closest match in
                        the application form and add a note.
                    </p>
                </div>
            </section>

            {/* ── How it works ──────────────────────────────────────────── */}
            <section className="tw-py-16">
                <div className="tw-container">
                    <h2 className="tw-text-3xl tw-font-bold tw-text-heading tw-mb-10 tw-text-center">
                        How it works
                    </h2>
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-7">
                        {HOW_IT_WORKS.map(({ step, title, body }) => (
                            <div key={step} className="tw-text-center">
                                <div className="tw-w-12 tw-h-12 tw-bg-primary tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-xl tw-font-bold tw-mx-auto tw-mb-4">
                                    {step}
                                </div>
                                <h3 className="tw-font-semibold tw-text-heading tw-mb-2">
                                    {title}
                                </h3>
                                <p className="tw-text-body tw-text-sm">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Commission tiers ──────────────────────────────────────── */}
            <section className="tw-py-16 tw-bg-light-100">
                <div className="tw-container">
                    <h2 className="tw-text-3xl tw-font-bold tw-text-heading tw-mb-3 tw-text-center">
                        Commission tiers
                    </h2>
                    <p className="tw-text-center tw-text-body tw-mb-10 tw-max-w-xl tw-mx-auto tw-text-sm">
                        Commissions are paid on Simple Migrate&rsquo;s service
                        fees only — never on government fees, legal
                        representation costs, or taxes.
                    </p>
                    <div className="tw-overflow-x-auto">
                        <table className="tw-w-full tw-text-sm tw-text-left">
                            <thead>
                                <tr className="tw-bg-primary tw-text-white">
                                    <th className="tw-px-4 tw-py-3 tw-font-semibold">
                                        Tier
                                    </th>
                                    <th className="tw-px-4 tw-py-3 tw-font-semibold">
                                        Rate
                                    </th>
                                    <th className="tw-px-4 tw-py-3 tw-font-semibold">
                                        Requirement
                                    </th>
                                    <th className="tw-px-4 tw-py-3 tw-font-semibold">
                                        Perks
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {TIERS.map((row, i) => (
                                    <tr
                                        key={row.tier}
                                        className={
                                            i % 2 === 0
                                                ? "tw-bg-white"
                                                : "tw-bg-light-100"
                                        }
                                    >
                                        <td className="tw-px-4 tw-py-3 tw-font-medium tw-text-heading">
                                            {row.tier}
                                        </td>
                                        <td className="tw-px-4 tw-py-3 tw-text-primary tw-font-semibold">
                                            {row.bps}
                                        </td>
                                        <td className="tw-px-4 tw-py-3 tw-text-body">
                                            {row.requirement}
                                        </td>
                                        <td className="tw-px-4 tw-py-3 tw-text-body">
                                            {row.perks}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="tw-text-xs tw-text-body tw-mt-4 tw-text-center">
                        Rates and thresholds are subject to change. The rates
                        confirmed in your signed partner agreement apply to
                        you.
                    </p>
                </div>
            </section>

            {/* ── Compliance notice ─────────────────────────────────────── */}
            <section className="tw-py-10">
                <div className="tw-container tw-max-w-3xl">
                    <div className="tw-border-l-4 tw-border-primary tw-pl-5 tw-py-4 tw-bg-light-100">
                        <p className="tw-text-sm tw-text-body">
                            <strong className="tw-text-heading">
                                Important:
                            </strong>{" "}
                            Simple Migrate does not provide immigration advice,
                            guarantees, or outcome predictions. Partners must
                            not make any promises about nomination, visa, or
                            PR outcomes on Simple Migrate&rsquo;s behalf.
                            Licensed immigration consultants (RCICs) and
                            lawyers are not eligible for referral commissions
                            under applicable professional rules.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── FAQ ───────────────────────────────────────────────────── */}
            <section className="tw-py-16 tw-bg-light-100">
                <div className="tw-container tw-max-w-3xl">
                    <h2 className="tw-text-3xl tw-font-bold tw-text-heading tw-mb-10 tw-text-center">
                        Frequently asked questions
                    </h2>
                    <div className="tw-space-y-6">
                        {FAQS.map(({ q, a }) => (
                            <div key={q} className="tw-bg-white tw-p-6 tw-rounded-sm tw-shadow-sm">
                                <h3 className="tw-font-semibold tw-text-heading tw-mb-2">
                                    {q}
                                </h3>
                                <p className="tw-text-body tw-text-sm">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────────── */}
            <section className="tw-py-20 tw-bg-primary">
                <div className="tw-container tw-text-center">
                    <h2 className="tw-text-3xl tw-font-bold tw-text-white tw-mb-5">
                        Ready to join the network?
                    </h2>
                    <p className="tw-text-lg tw-text-white/80 tw-max-w-xl tw-mx-auto tw-mb-9">
                        Applications take under five minutes. Our team
                        responds within five business days.
                    </p>
                    <Anchor
                        path="/partners/apply"
                        className="tw-inline-block tw-px-8 tw-py-3 tw-rounded-sm tw-font-semibold tw-bg-white tw-text-primary hover:tw-bg-light-100 tw-transition-colors"
                    >
                        Apply now
                    </Anchor>
                </div>
            </section>
        </>
    );
};

PartnersPage.Layout = Layout;

export const getStaticProps: GetStaticProps = () => {
    return {
        props: {
            layout: {
                headerShadow: true,
                headerFluid: false,
                footerMode: "light",
            },
        },
    };
};

export default PartnersPage;
