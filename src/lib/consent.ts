/**
 * Visitor consent for analytics (Google Analytics, Microsoft Clarity) on the
 * public site. Nothing analytics-related loads until consent is "granted".
 * The choice is kept in localStorage; every access is wrapped because
 * storage can be unavailable (private mode, blocked site data).
 */
export type ConsentValue = "granted" | "denied";

const STORAGE_KEY = "sm-analytics-consent-v1";
export const CONSENT_CHANGE_EVENT = "sm:consent-change";
export const CONSENT_OPEN_EVENT = "sm:consent-open";

export function readConsent(): ConsentValue | null {
    try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return v === "granted" || v === "denied" ? v : null;
    } catch {
        return null;
    }
}

const ANALYTICS_COOKIE = /^(_ga|_gid|_gat|_clck|_clsk|CLID|MUID|ANONCHK|SM)(_|$)/;

/** Remove first-party analytics cookies set by GA/Clarity on this site. */
function clearAnalyticsCookies() {
    const host = window.location.hostname;
    const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
    document.cookie.split(";").forEach((pair) => {
        const name = pair.split("=")[0].trim();
        if (!ANALYTICS_COOKIE.test(name)) return;
        domains.forEach((d) => {
            document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
        });
    });
}

export function writeConsent(value: ConsentValue) {
    const previous = readConsent();
    try {
        window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
        /* storage unavailable: choice applies to this page view only */
    }
    if (value === "denied") clearAnalyticsCookies();
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: value }));
    // Scripts that already ran can't be unloaded; reload so they stop.
    if (previous === "granted" && value === "denied") window.location.reload();
}

/** Ask the banner to reappear (e.g. from "Cookie preferences" links). */
export function openConsentPreferences() {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
