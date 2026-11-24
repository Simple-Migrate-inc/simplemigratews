import type { GetStaticProps, NextPage } from "next";
import { useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import SEO from "@components/seo/page-seo";
import Layout from "@layout/layout-01";
import Breadcrumb from "@components/breadcrumb";

type PageProps = NextPage & {
    Layout: typeof Layout;
};

type FormState = "idle" | "submitting" | "success" | "error";

const ORG_TYPES = [
    { value: "marketing",           label: "Marketing partner (blogger, media, content creator)" },
    { value: "professional",        label: "Professional advisor (accountant, wealth manager, HR)" },
    { value: "strategic",           label: "Strategic partner (chamber of commerce, association, govt body)" },
    { value: "ambassador",          label: "Ambassador (community leader, trusted individual)" },
    { value: "licensed_immigration", label: "Licensed immigration consultant / lawyer" },
];

const SEGMENTS = [
    "Entrepreneurs buying a business",
    "Business owners selling / exiting",
    "Investor visa applicants",
    "Start-up founders",
    "Skilled workers",
    "Real estate investors",
    "Education sector",
    "Other immigrants",
];

const HEARD_FROM_OPTIONS = [
    "Google search",
    "LinkedIn",
    "Referral from another partner",
    "Client referral",
    "Event / conference",
    "Social media",
    "Other",
];

const ApplyPage: PageProps = () => {
    const router = useRouter();
    const honeypotRef = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<FormState>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [form, setForm] = useState({
        contactName: "",
        email: "",
        phone: "",
        company: "",
        website: "",
        country: "",
        city: "",
        type: "",
        segments: [] as string[],
        estReferralsPerQtr: "",
        licenceNo: "",
        heardFrom: "",
        caslMarketingConsent: false,
        conductAccepted: false,
        privacyAccepted: false,
    });

    const set = (field: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const target = e.target as HTMLInputElement;
            setForm((prev) => ({
                ...prev,
                [field]: target.type === "checkbox" ? target.checked : target.value,
            }));
        };

    const toggleSegment = (seg: string) => {
        setForm((prev) => ({
            ...prev,
            segments: prev.segments.includes(seg)
                ? prev.segments.filter((s) => s !== seg)
                : [...prev.segments, seg],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check (client-side fast fail)
        if (honeypotRef.current?.value) return;

        if (!form.type) {
            setErrorMsg("Please select a partner type.");
            return;
        }
        if (form.website && !/^https?:\/\/.+/.test(form.website)) {
            setErrorMsg("Website must start with https:// (e.g. https://yoursite.com).");
            return;
        }
        if (!form.conductAccepted || !form.privacyAccepted) {
            setErrorMsg("Please accept the Code of Conduct and Privacy Policy to continue.");
            return;
        }

        setState("submitting");
        setErrorMsg("");

        try {
            const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].reduce(
                (acc, k) => {
                    const v = router.query[k];
                    if (v) acc[k] = String(v);
                    return acc;
                },
                {} as Record<string, string>
            );

            const res = await fetch("/api/partners/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, utm: utmParams }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Something went wrong. Please try again.");
            }

            setState("success");
        } catch (err) {
            setState("error");
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        }
    };

    if (state === "success") {
        return (
            <>
                <SEO title="Application received" />
                <Breadcrumb
                    pages={[
                        { path: "/", label: "home" },
                        { path: "/partners", label: "partners" },
                    ]}
                    currentPage="Application received"
                    showTitle={false}
                />
                <section className="tw-py-24">
                    <div className="tw-container tw-max-w-lg tw-text-center">
                        <div className="tw-text-5xl tw-text-primary tw-mb-6">
                            <i className="fas fa-check-circle" />
                        </div>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-heading tw-mb-4">
                            Application received
                        </h1>
                        <p className="tw-text-body tw-mb-6">
                            Thank you for applying to the Simple Migrate
                            Partner Network. Our team will review your
                            application and be in touch within five business
                            days.
                        </p>
                        <Link
                            href="/partners"
                            className="tw-text-primary tw-font-medium hover:tw-underline"
                        >
                            Back to Partners
                        </Link>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <SEO
                title="Apply — Partner Program"
                description="Apply to join the Simple Migrate Global Partner Network. Takes under five minutes."
            />
            <Breadcrumb
                pages={[
                    { path: "/", label: "home" },
                    { path: "/partners", label: "partners" },
                ]}
                currentPage="Apply"
                showTitle={false}
            />

            <section className="tw-py-16">
                <div className="tw-container tw-max-w-2xl">
                    <h1 className="tw-text-3xl tw-font-bold tw-text-heading tw-mb-3">
                        Partner application
                    </h1>
                    <p className="tw-text-body tw-mb-10">
                        Takes under five minutes. Our team responds within
                        five business days.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Honeypot — hidden from humans */}
                        <div style={{ display: "none" }} aria-hidden="true">
                            <input
                                ref={honeypotRef}
                                type="text"
                                name="website_confirm"
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>

                        {/* ── Contact details ────────────────────────── */}
                        <fieldset className="tw-mb-8">
                            <legend className="tw-text-lg tw-font-semibold tw-text-heading tw-mb-5">
                                Contact details
                            </legend>
                            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-5">
                                <div>
                                    <label
                                        htmlFor="contactName"
                                        className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                    >
                                        Your full name <span className="tw-text-red-500">*</span>
                                    </label>
                                    <input
                                        id="contactName"
                                        type="text"
                                        required
                                        value={form.contactName}
                                        onChange={set("contactName")}
                                        className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                    >
                                        Email address <span className="tw-text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={set("email")}
                                        className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                    >
                                        Phone (with country code) <span className="tw-text-red-500">*</span>
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        required
                                        value={form.phone}
                                        onChange={set("phone")}
                                        placeholder="+91 98765 43210"
                                        className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="company"
                                        className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                    >
                                        Organisation / company name <span className="tw-text-red-500">*</span>
                                    </label>
                                    <input
                                        id="company"
                                        type="text"
                                        required
                                        value={form.company}
                                        onChange={set("company")}
                                        className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="website"
                                        className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                    >
                                        Website (optional)
                                    </label>
                                    <input
                                        id="website"
                                        type="url"
                                        value={form.website}
                                        onChange={set("website")}
                                        placeholder="https://yoursite.com"
                                        className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        {/* ── Location ───────────────────────────────── */}
                        <fieldset className="tw-mb-8">
                            <legend className="tw-text-lg tw-font-semibold tw-text-heading tw-mb-5">
                                Location
                            </legend>
                            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-5">
                                <div>
                                    <label
                                        htmlFor="country"
                                        className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                    >
                                        Country <span className="tw-text-red-500">*</span>
                                    </label>
                                    <input
                                        id="country"
                                        type="text"
                                        required
                                        value={form.country}
                                        onChange={set("country")}
                                        className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="city"
                                        className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                    >
                                        City <span className="tw-text-red-500">*</span>
                                    </label>
                                    <input
                                        id="city"
                                        type="text"
                                        required
                                        value={form.city}
                                        onChange={set("city")}
                                        className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        {/* ── Partnership details ────────────────────── */}
                        <fieldset className="tw-mb-8">
                            <legend className="tw-text-lg tw-font-semibold tw-text-heading tw-mb-5">
                                About your network
                            </legend>

                            <div className="tw-mb-5">
                                <label
                                    htmlFor="type"
                                    className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                >
                                    Partner type <span className="tw-text-red-500">*</span>
                                </label>
                                <select
                                    id="type"
                                    required
                                    value={form.type}
                                    onChange={set("type")}
                                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                >
                                    <option value="">Select a type…</option>
                                    {ORG_TYPES.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                {form.type === "licensed_immigration" && (
                                    <p className="tw-text-sm tw-text-amber-700 tw-mt-2 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-sm tw-p-3">
                                        Note: Licensed immigration consultants
                                        and lawyers are not eligible for
                                        referral commissions under CICC and
                                        law society rules. You are welcome to
                                        apply for a non-commission
                                        collaboration arrangement instead.
                                    </p>
                                )}
                            </div>

                            <div className="tw-mb-5">
                                <p className="tw-text-sm tw-font-medium tw-text-heading tw-mb-3">
                                    Which segments does your network serve?{" "}
                                    <span className="tw-text-body tw-font-normal">
                                        (select all that apply)
                                    </span>
                                </p>
                                <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2">
                                    {SEGMENTS.map((seg) => (
                                        <label
                                            key={seg}
                                            className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-body tw-cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.segments.includes(seg)}
                                                onChange={() => toggleSegment(seg)}
                                                className="tw-rounded"
                                            />
                                            {seg}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="tw-mb-5">
                                <label
                                    htmlFor="estReferrals"
                                    className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                >
                                    Estimated referrals per quarter
                                </label>
                                <select
                                    id="estReferrals"
                                    value={form.estReferralsPerQtr}
                                    onChange={set("estReferralsPerQtr")}
                                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                >
                                    <option value="">Not sure yet</option>
                                    <option value="1">1–2</option>
                                    <option value="3">3–5</option>
                                    <option value="6">6–9</option>
                                    <option value="10">10 or more</option>
                                </select>
                            </div>

                            <div className="tw-mb-5">
                                <label
                                    htmlFor="licenceNo"
                                    className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                >
                                    Professional licence number{" "}
                                    <span className="tw-text-body tw-font-normal">
                                        (if applicable)
                                    </span>
                                </label>
                                <input
                                    id="licenceNo"
                                    type="text"
                                    value={form.licenceNo}
                                    onChange={set("licenceNo")}
                                    placeholder="e.g. CICC R123456"
                                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="heardFrom"
                                    className="tw-block tw-text-sm tw-font-medium tw-text-heading tw-mb-1"
                                >
                                    How did you hear about us?
                                </label>
                                <select
                                    id="heardFrom"
                                    value={form.heardFrom}
                                    onChange={set("heardFrom")}
                                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded-sm tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-border-primary"
                                >
                                    <option value="">Prefer not to say</option>
                                    {HEARD_FROM_OPTIONS.map((o) => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>
                        </fieldset>

                        {/* ── Consents ───────────────────────────────── */}
                        <fieldset className="tw-mb-8">
                            <legend className="tw-text-lg tw-font-semibold tw-text-heading tw-mb-5">
                                Consents
                            </legend>

                            <label className="tw-flex tw-items-start tw-gap-3 tw-mb-4 tw-cursor-pointer">
                                <input
                                    type="checkbox"
                                    required
                                    checked={form.conductAccepted}
                                    onChange={set("conductAccepted")}
                                    className="tw-mt-0.5"
                                />
                                <span className="tw-text-sm tw-text-body">
                                    I have read and agree to the Simple
                                    Migrate{" "}
                                    <a
                                        href="/terms-of-service"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tw-text-primary hover:tw-underline"
                                    >
                                        Partner Code of Conduct
                                    </a>
                                    .{" "}
                                    <span className="tw-text-red-500">*</span>
                                </span>
                            </label>

                            <label className="tw-flex tw-items-start tw-gap-3 tw-mb-4 tw-cursor-pointer">
                                <input
                                    type="checkbox"
                                    required
                                    checked={form.privacyAccepted}
                                    onChange={set("privacyAccepted")}
                                    className="tw-mt-0.5"
                                />
                                <span className="tw-text-sm tw-text-body">
                                    I have read and agree to the Simple
                                    Migrate{" "}
                                    <a
                                        href="/privacy-policy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tw-text-primary hover:tw-underline"
                                    >
                                        Privacy Policy
                                    </a>
                                    .{" "}
                                    <span className="tw-text-red-500">*</span>
                                </span>
                            </label>

                            {/* CASL marketing consent starts UNTICKED — mandatory */}
                            <label className="tw-flex tw-items-start tw-gap-3 tw-cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.caslMarketingConsent}
                                    onChange={set("caslMarketingConsent")}
                                    className="tw-mt-0.5"
                                />
                                <span className="tw-text-sm tw-text-body">
                                    I would like to receive updates, tips, and
                                    partner programme news from Simple Migrate
                                    by email.{" "}
                                    <span className="tw-text-xs tw-text-body">
                                        (Optional — you can unsubscribe at any
                                        time.)
                                    </span>
                                </span>
                            </label>
                        </fieldset>

                        {errorMsg && (
                            <div className="tw-mb-5 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-sm tw-text-sm tw-text-red-700">
                                {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={state === "submitting"}
                            className="tw-w-full tw-bg-primary tw-text-white tw-font-semibold tw-py-3 tw-rounded-sm hover:tw-bg-primary-dark tw-transition-colors disabled:tw-opacity-60"
                        >
                            {state === "submitting"
                                ? "Submitting…"
                                : "Submit application"}
                        </button>

                        <p className="tw-text-xs tw-text-body tw-mt-4 tw-text-center">
                            By submitting, your information will be processed
                            in accordance with our Privacy Policy. We will
                            never sell your data.
                        </p>
                    </form>
                </div>
            </section>
        </>
    );
};

ApplyPage.Layout = Layout;

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

export default ApplyPage;
