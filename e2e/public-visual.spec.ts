import { test, expect } from "@playwright/test";

// Visual regression guard for the existing public site. The dashboard work
// must leave these pages pixel-identical (apart from the one nav link).
const PAGES = [
    "/",
    "/canada-immigration",
    "/setup-business",
    "/contact-us",
    "/start-here",
];

for (const path of PAGES) {
    test(`public page unchanged: ${path}`, async ({ page }) => {
        await page.goto(path, { waitUntil: "networkidle" });
        // The home hero's typewriter text changes length over time, which
        // changes line wrapping (and page height) on mobile. Hide it.
        await page.addStyleTag({
            content: "h1 > span.tw-text-primary { visibility: hidden !important; display: inline-block; width: 1px; }",
        });
        // Let lazy images and entry animations settle.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        // Background videos change frame by frame; freeze them on frame 0.
        await page.evaluate(() =>
            Promise.all(
                Array.from(document.querySelectorAll("video")).map(
                    (v) =>
                        new Promise<void>((resolve) => {
                            v.pause();
                            if (v.currentTime === 0) return resolve();
                            v.addEventListener("seeked", () => resolve(), { once: true });
                            v.currentTime = 0;
                        })
                )
            )
        );
        // Some existing sections overflow horizontally on mobile by a varying
        // amount, so clip to the viewport width.
        const width = page.viewportSize()?.width ?? 1280;
        const height = await page.evaluate(
            () => document.documentElement.scrollHeight
        );
        await expect(page).toHaveScreenshot({
            fullPage: true,
            clip: { x: 0, y: 0, width, height },
            // Sliders change over time.
            mask: [page.locator(".swiper"), page.locator("iframe")],
        });
    });
}
