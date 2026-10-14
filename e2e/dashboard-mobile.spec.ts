import { expect, test } from "@playwright/test";

test("dashboard works at phone width with bottom navigation", async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByLabel("Password").fill("SimpleMigrate-dev-2026");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();

    const bottomNav = page.getByRole("navigation", { name: "Dashboard" }).last();
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Account" })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
});
