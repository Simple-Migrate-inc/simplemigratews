import { type Page, expect, test } from "@playwright/test";
import { totp } from "./totp";

const PASSWORD = "SimpleMigrate-dev-2026";

async function signIn(page: Page, email: string) {
    await page.goto("/app/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

// Next.js renders its own (empty) role="alert" route announcer; skip it.
const formAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

test.describe.configure({ mode: "serial" });

test("unauthenticated visitors are sent to sign in", async ({ page }) => {
    await page.goto("/app/admin");
    await expect(page).toHaveURL(/\/app\/login\?next=%2Fapp%2Fadmin/);
    await expect(page.getByRole("heading", { name: "Client sign in" })).toBeVisible();
});

test("public sign-up is not possible", async ({ request }) => {
    const res = await request.post("/api/auth/sign-up/email", {
        data: { email: "intruder@example.com", password: "x".repeat(16), name: "X" },
    });
    expect(res.status()).toBe(404);
});

test("wrong password is rejected", async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(formAlert(page)).toContainText("incorrect");
});

test("candidate lands on their home and cannot open staff areas", async ({ page }) => {
    await signIn(page, "candidate@example.com");
    await expect(page.getByRole("heading", { name: "Welcome, Sam" })).toBeVisible();
    await expect(page.getByText("Jordan Lee, RCIC")).toBeVisible();
    await expect(page.getByText("Information only — eligibility is decided by the program")).toBeVisible();

    for (const area of ["/app/admin", "/app/consultant", "/app/partner", "/app/agent"]) {
        await page.goto(area);
        await expect(page).toHaveURL(/\/app$/);
    }
});

let adminSecret = "";

test("admin must enrol in MFA, then lands on admin home", async ({ page }) => {
    await signIn(page, "admin@example.com");
    await expect(page).toHaveURL(/\/app\/setup-mfa/);
    // Staff can't skip enrolment by going elsewhere.
    await page.goto("/app/admin");
    await expect(page).toHaveURL(/\/app\/setup-mfa/);

    await page.getByLabel("Confirm your password").fill(PASSWORD);
    await page.getByRole("button", { name: "Continue" }).click();
    const key = page.locator("code").first();
    await expect(key).toBeVisible();
    adminSecret = (await key.textContent())!.trim();

    await page.getByLabel("Authentication code").fill(totp(adminSecret));
    await page.getByRole("button", { name: "Turn on two-step verification" }).click();
    await expect(page).toHaveURL(/\/app\/admin$/);
    await expect(page.getByRole("heading", { name: "Admin overview" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Sam Rivera", exact: true })).toBeVisible();
});

test("admin sign-in now requires an authenticator code", async ({ page }) => {
    await signIn(page, "admin@example.com");
    await expect(page).toHaveURL(/\/app\/login\/two-factor/);
    await page.getByLabel("Authentication code").fill("000000");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(formAlert(page)).toBeVisible();

    await page.getByLabel("Authentication code").fill(totp(adminSecret, 1));
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/app\/admin$/);
});

test("admin invites a candidate who accepts once and lands on their home", async ({ page, browser }) => {
    await signIn(page, "admin@example.com");
    await page.getByLabel("Authentication code").fill(totp(adminSecret, 1));
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/app\/admin$/);

    await page.goto("/app/admin/users");
    await page.getByLabel("Email").fill("new.candidate@example.com");
    await page.getByLabel("Name (optional)").fill("Alex Morgan");
    await page.getByRole("button", { name: "Send invitation" }).click();
    const link = page.getByRole("link", { name: /\/app\/invite\// });
    await expect(link).toBeVisible();
    const inviteUrl = (await link.getAttribute("href"))!;

    const ctx = await browser.newContext();
    const invitee = await ctx.newPage();
    await invitee.goto(inviteUrl);
    await expect(invitee.getByText("new.candidate@example.com")).toBeVisible();

    // Consents are required.
    await invitee.getByRole("textbox", { name: "Password", exact: true }).fill("a-strong-passphrase-1");
    await invitee.getByLabel("Confirm password").fill("a-strong-passphrase-1");
    for (const box of await invitee.getByRole("checkbox").all()) await box.check();
    await invitee.getByRole("button", { name: "Create account" }).click();
    await expect(invitee.getByRole("heading", { name: "Welcome, Alex" })).toBeVisible();

    // The link is single-use.
    const again = await ctx.newPage();
    await again.goto(inviteUrl);
    await expect(again.getByRole("heading", { name: "Invitation not available" })).toBeVisible();
    await ctx.close();

    // Their consent wording is on record.
    await page.goto("/app/admin");
    await expect(page.getByRole("cell", { name: "Alex Morgan", exact: true })).toBeVisible();
});

test("suspended users lose access immediately", async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const cand = await ctx.newPage();
    await signIn(cand, "candidate@example.com");
    await expect(cand.getByRole("heading", { name: "Welcome, Sam" })).toBeVisible();

    await signIn(page, "admin@example.com");
    await page.getByLabel("Authentication code").fill(totp(adminSecret, 1));
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/app\/admin$/);
    await page.goto("/app/admin/users");
    const row = page.getByRole("row", { name: /Sam Rivera/ });
    await row.getByRole("button", { name: "Suspend" }).click();
    await expect(row.getByText("suspended")).toBeVisible();

    await cand.reload();
    await expect(cand).toHaveURL(/\/app\/login/);
    await signIn(cand, "candidate@example.com");
    await expect(formAlert(cand)).toBeVisible();
    await ctx.close();

    await row.getByRole("button", { name: "Reactivate" }).click();
    await expect(row.getByText("active", { exact: true })).toBeVisible();
});
