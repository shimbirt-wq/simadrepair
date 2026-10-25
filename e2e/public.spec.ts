import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PUBLIC_PAGES = ["/", "/request-repair", "/track", "/find", "/about", "/auth/login", "/does-not-exist"];

test.describe("public website", () => {
  test("home page offers the main actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Find my request" }).first()).toHaveAttribute("href", "/find");
    await expect(page.getByRole("link", { name: "Staff sign-in" }).first()).toHaveAttribute("href", "/auth/login");
    await expect(page.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });

  test("hero tracking input validates and opens the tracking page", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Already registered? Track your repair");
    await input.fill("hello");
    await input.press("Enter");
    await expect(page.locator("#hero-track-error")).toContainText("doesn't look like a tracking code");
    await input.fill("sim 26 k7p3qx");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/track\?code=SIM-26-K7P3QX/);
  });

  test("unknown pages show a friendly 404 with the main actions", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page doesn't exist." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Track a repair" })).toBeVisible();
  });

  test("staff sign-in points students elsewhere", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: "Staff sign-in" })).toBeVisible();
    await expect(page.getByText(/Staff only/)).toBeVisible();
  });

  test("keyboard: skip link reaches the content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  for (const path of PUBLIC_PAGES) {
    test(`no serious accessibility issues on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
