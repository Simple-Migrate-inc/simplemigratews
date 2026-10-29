import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@ui/button";
import {
    type ConsentValue,
    CONSENT_CHANGE_EVENT,
    CONSENT_OPEN_EVENT,
    openConsentPreferences,
    readConsent,
    writeConsent,
} from "../../lib/consent";

/** Current consent choice; null until the visitor decides (or before mount). */
export function useConsent(): ConsentValue | null {
    const [value, setValue] = useState<ConsentValue | null>(null);
    useEffect(() => {
        setValue(readConsent());
        const onChange = (e: Event) => setValue((e as CustomEvent<ConsentValue>).detail);
        window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
        return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    }, []);
    return value;
}

// Show the banner only when there is something to consent to (analytics IDs
// are set in Production), or in local development so it can be reviewed.
const ENABLED =
    Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) ||
    process.env.NODE_ENV === "development";

const CookieConsent = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!ENABLED) return undefined;
        if (readConsent() === null) setOpen(true);
        const reopen = () => setOpen(true);
        window.addEventListener(CONSENT_OPEN_EVENT, reopen);
        return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
    }, []);

    if (!open) return null;

    const choose = (value: ConsentValue) => {
        writeConsent(value);
        setOpen(false);
    };

    return (
        <section
            role="region"
            aria-label="Cookie preferences"
            className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-[60] tw-p-3 sm:tw-p-5"
        >
            <div className="tw-container tw-max-w-[1000px] tw-bg-white tw-rounded-lg tw-border tw-border-gray-500 tw-shadow-2md tw-shadow-black/10 tw-p-5 md:tw-p-6 md:tw-flex md:tw-items-center md:tw-gap-7.5">
                <div className="tw-flex-1">
                    <h2 className="tw-text-h6 md:tw-text-h5 tw-mb-1.5">Your privacy choices</h2>
                    <p className="tw-text-md tw-mb-0">
                        With your consent, we use Google Analytics and Microsoft Clarity cookies to understand how
                        visitors use our site and improve it. We don&apos;t use them for advertising. You can change
                        your choice at any time. See our{" "}
                        <Link href="/privacy-policy" className="tw-text-primary tw-underline">
                            privacy policy
                        </Link>
                        .
                    </p>
                </div>
                <div className="tw-flex tw-gap-3 tw-mt-4 md:tw-mt-0 tw-shrink-0">
                    <Button size="xs" className="tw-flex-1 md:tw-flex-none tw-min-w-[110px]" onClick={() => choose("granted")}>
                        Accept
                    </Button>
                    <Button
                        size="xs"
                        variant="outlined"
                        className="tw-flex-1 md:tw-flex-none tw-min-w-[110px]"
                        onClick={() => choose("denied")}
                    >
                        Decline
                    </Button>
                </div>
            </div>
        </section>
    );
};

/** Button that reopens the banner, e.g. on the privacy policy page. */
export const CookiePreferencesButton = ({ className = "" }: { className?: string }) => (
    <Button variant="outlined" size="xs" className={className} onClick={openConsentPreferences}>
        Cookie preferences
    </Button>
);

export default CookieConsent;
