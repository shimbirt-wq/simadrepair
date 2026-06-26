import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";
import { hashPassword } from "../src/lib/auth/password";

const bootstrapAdminEmail = "abdulsalam.shiikhow@gmail.com";
const bootstrapAdminPassword = process.env.SEED_ADMIN_PASSWORD?.trim() ? process.env.SEED_ADMIN_PASSWORD : "password";
const staffPassword = "E2ePass123!";
const prisma = new PrismaClient();

const staffFixtures = [
  {
    department: "Service Desk",
    email: "playwright-lead@example.invalid",
    expectedHeading: /command center/i,
    expectedUrl: /\/lead$/,
    fullName: "Playwright Lead Technician",
    label: "lead technician",
    phone: "+252610009101",
    role: "LEAD_TECHNICIAN",
    universityId: "PW-LEAD-001",
  },
  {
    department: "Computer Maintenance",
    email: "playwright-tech@example.invalid",
    expectedHeading: /assigned repair work/i,
    expectedUrl: /\/technician\/workspace$/,
    fullName: "Playwright Technician",
    label: "technician",
    phone: "+252610009102",
    role: "TECHNICIAN",
    universityId: "PW-TECH-001",
  },
] as const;

const users: ReadonlyArray<{
  email: string;
  expectedHeading: RegExp;
  expectedUrl: RegExp;
  label: string;
  password: string;
}> = [
  {
    email: bootstrapAdminEmail,
    expectedHeading: /overview/i,
    expectedUrl: /\/dashboard$/,
    label: "admin",
    password: bootstrapAdminPassword,
  },
  ...staffFixtures.map((fixture) => ({
    email: fixture.email,
    expectedHeading: fixture.expectedHeading,
    expectedUrl: fixture.expectedUrl,
    label: fixture.label,
    password: staffPassword,
  })),
];

async function ensureStaffFixtures() {
  const passwordHash = await hashPassword(staffPassword);

  for (const fixture of staffFixtures) {
    await prisma.user.upsert({
      where: {
        email: fixture.email,
      },
      update: {
        fullName: fixture.fullName,
        universityId: fixture.universityId,
        faculty: "Quality Assurance",
        department: fixture.department,
        phone: fixture.phone,
        passwordHash,
        role: fixture.role,
        isActive: true,
      },
      create: {
        fullName: fixture.fullName,
        universityId: fixture.universityId,
        faculty: "Quality Assurance",
        department: fixture.department,
        phone: fixture.phone,
        email: fixture.email,
        passwordHash,
        role: fixture.role,
        isActive: true,
      },
    });
  }
}

async function cleanupStaffFixtures() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: staffFixtures.map((fixture) => fixture.email),
      },
    },
  });
  await prisma.$disconnect();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  const loginResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/login") && response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.getByRole("button", { name: /^sign in$/i }).click();

  const response = await loginResponse;
  expect(response.ok(), `${email} login failed with HTTP ${response.status()}`).toBeTruthy();
}

test.describe("staff sign-in routing", () => {
  test.beforeAll(async () => {
    await ensureStaffFixtures();
  });

  test.afterAll(async () => {
    await cleanupStaffFixtures();
  });

  for (const user of users) {
    test(`${user.label} lands on the role workspace`, async ({ page }) => {
      await signIn(page, user.email, user.password);

      await expect(page).toHaveURL(user.expectedUrl, { timeout: 30_000 });
      await expect(page.getByRole("heading", { name: user.expectedHeading })).toBeVisible();
      await expect(page).not.toHaveURL(/\/profile$/);
    });
  }
});
