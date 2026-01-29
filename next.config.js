/** @type {import('next').NextConfig} */
const runtimeCaching = require("next-pwa/cache");
const withPWA = require("next-pwa")({
    disable: process.env.NODE_ENV === "development",
    dest: "public",
    register: true,
    runtimeCaching,
    buildExcludes: [
        /\/*server\/middleware-chunks\/[0-9]*[a-z]*[A-Z]*\.js$/,
        /middleware-manifest\.json$/,
        /middleware-runtime\.js$/,
        /_middleware\.js$/,
        /^.+\\_middleware\.js$/,
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
        images: {
            unoptimized: true,
        },
        webpack(config) {
            return config;
        },
    })
);
