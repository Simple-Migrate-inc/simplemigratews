/** @type {import('next').NextConfig} */
const defaultRuntimeCaching = require("next-pwa/cache");

// Never let the service worker cache the authenticated dashboard or its
// APIs: candidate files and documents must not persist in browser caches.
const runtimeCaching = [
    {
        urlPattern: ({ url }) =>
            url.pathname === "/app" ||
            url.pathname.startsWith("/app/") ||
            url.pathname.startsWith("/api/dashboard") ||
            url.pathname.startsWith("/api/auth") ||
            url.pathname.startsWith("/api/cron"),
        handler: "NetworkOnly",
        options: { cacheName: "dashboard-network-only" },
    },
    ...defaultRuntimeCaching,
];
const withPWA = require("next-pwa")({
    disable:
        process.env.NODE_ENV === "development" ||
        process.env.npm_lifecycle_event === "export",
    dest: "public",
    register: true,
    runtimeCaching,
    buildExcludes: [
        /\/*server\/middleware-chunks\/[0-9]*[a-z]*[A-Z]*\.js$/,
        /middleware-manifest\.json$/,
        /middleware-runtime\.js$/,
        /_middleware\.js$/,
        /^.+\\_middleware\.js$/,
        // App Router manifests are server-only; precaching them 404s.
        /app-build-manifest\.json$/,
        /server\/app\/.*/,
    ],
    publicExcludes: ["!robots.txt"],
});
const path = require("path");
const withReactSvg = require("next-react-svg")({
    include: path.resolve(__dirname, "src/assets/svgs"),
});

module.exports = withPWA(
    withReactSvg({
        reactStrictMode: false,
        experimental: {
            esmExternals: false,
        },
        images: {
            unoptimized: true,
        },
        webpack(config) {
            return config;
        },
    })
);
