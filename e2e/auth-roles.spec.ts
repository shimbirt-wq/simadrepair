import { expect, test, type Page } from "@playwright/test";

const seedPassword = "TestPass123!";

const users = [
  {
    email: "admin@simadrepair.test",
    expectedHeading: /overview/i,
    expectedUrl: /\/dashboard$/,
    label: "admin",
  },
  {
    email: "lead@simadrepair.test",
    expectedHeading: /command center/i,
    expectedUrl: /\/lead$/,
    label: "lead technician",
  },
  {
    email: "tech@simadrepair.test",
    expectedHeading: /assigned repair work/i,
    expectedUrl: /\/technician\/workspace$/,
    label: "technician",
  },
];

async function signIn(page: Page, email: string) {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(seedPassword);

  const loginResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/login") && response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.getByRole("button", { name: /^sign in$/i }).click();

  const response = await loginResponse;
  expect(response.ok(), `${email} login failed with HTTP ${response.status()}`).toBeTruthy();
}

test.describe("staff sign-in routing", () => {
  for (const user of users) {
    test(`${user.label} lands on the role workspace`, async ({ page }) => {
      await signIn(page, user.email);

      await expect(page).toHaveURL(user.expectedUrl, { timeout: 30_000 });
      await expect(page.getByRole("heading", { name: user.expectedHeading })).toBeVisible();
      await expect(page).not.toHaveURL(/\/profile$/);
    });
  }
});
