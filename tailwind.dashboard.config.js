/* eslint-disable global-require */
// Tailwind config for the dashboard stylesheet only (src/app/dashboard.css).
// Uses the public site's config as a preset so tokens, fonts and the `tw-`
// prefix are identical, but scans only dashboard sources and the shared UI
// components the dashboard reuses.
module.exports = {
    presets: [require("./tailwind.config.js")],
    content: [
        "./src/app/**/*.tsx",
        "./src/components/dashboard/**/*.tsx",
        "./src/components/ui/**/*.tsx",
    ],
};
