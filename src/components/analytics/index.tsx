import Script from "next/script";

/**
 * Google Analytics 4 + Microsoft Clarity for the public marketing site.
 *
 * - IDs come from env vars set only for Vercel *Production*, so local dev and
 *   preview deployments never send data.
 * - Rendered from pages/_app.tsx only, so the authenticated dashboard (/app,
 *   App Router) is never tracked or session-recorded.
 * - Loaded after the page is interactive (doesn't block rendering).
 * - Page views on client-side navigation are captured by GA4 Enhanced
 *   Measurement ("page changes based on browser history events"), so no
 *   manual page_view events are sent (that would double count).
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

const Analytics = () => (
    <>
        {GA_ID && (
            <>
                <Script
                    id="ga4-src"
                    src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                    strategy="afterInteractive"
                />
                <Script id="ga4-init" strategy="afterInteractive">
                    {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
// Consent Mode v2: analytics only; no advertising storage or signals.
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted'
});
gtag('js', new Date());
gtag('config', '${GA_ID}', { allow_google_signals: false, allow_ad_personalization_signals: false });
`}
                </Script>
            </>
        )}
        {CLARITY_ID && (
            <Script id="ms-clarity" strategy="afterInteractive">
                {`
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");
`}
            </Script>
        )}
    </>
);

export default Analytics;
