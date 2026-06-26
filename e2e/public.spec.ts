import { expect, test } from "@playwright/test";

test.describe("public repair flow", () => {
  test("landing page exposes the primary public actions", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /reliable it support/i,
      }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /submit a request/i }).first()).toHaveAttribute(
      "href",
      "/request-repair",
    );
    await expect(page.getByRole("link", { name: /track your request/i }).first()).toHaveAttribute("href", "/track");
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toHaveAttribute("href", "/auth/login");
  });

  test("request form validates the required intake fields before submission", async ({ page }) => {
    await page.goto("/request-repair");

    await expect(
      page.getByRole("heading", {
        name: /request a repair/i,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: /submit request/i }).click();

    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await expect(page.getByText("Enter your SIMAD ID.")).toBeVisible();
    await expect(page.getByText("Enter a reachable phone number.")).toBeVisible();
    await expect(page.getByText("Enter the device type.")).toBeVisible();
    await expect(page.getByText("Describe the problem in at least 10 characters.")).toBeVisible();
  });

  test("tracking page rejects malformed tracking codes without calling private pages", async ({ page }) => {
    await page.goto("/track");

    await expect(
      page.getByRole("heading", {
        name: /check your repair status/i,
      }),
    ).toBeVisible();

    await page.getByLabel(/tracking code/i).fill("bad-code");
    await page.getByRole("button", { name: /check status/i }).click();

    await expect(page.getByText("Invalid tracking code")).toBeVisible();
    await expect(page.getByText("Use a tracking code in this format: SIM-2026-1000001.")).toBeVisible();
  });
});
