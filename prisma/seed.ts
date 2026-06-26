import { PrismaClient } from "@prisma/client";
import {
  BOOTSTRAP_ADMIN_DEFAULT_PASSWORD,
  BOOTSTRAP_ADMIN_EMAIL,
  BOOTSTRAP_ADMIN_PASSWORD_ENV,
  LEGACY_LOCAL_SEED_EMAILS,
  LEGACY_LOCAL_SEED_USER_IDS,
  buildBootstrapAdminSeed,
  getBootstrapAdminPassword,
  hashBootstrapAdminPassword,
} from "./seed-helpers";

const prisma = new PrismaClient();

async function main() {
  const password = getBootstrapAdminPassword();
  const passwordHash = await hashBootstrapAdminPassword(password);
  const bootstrapAdmin = buildBootstrapAdminSeed(passwordHash);
  const usesConfiguredPassword = Boolean(process.env[BOOTSTRAP_ADMIN_PASSWORD_ENV]?.trim());

  const cleanup = await prisma.$transaction(async (tx) => {
    const legacyRepairTickets = await tx.repairTicket.deleteMany({
      where: {
        ticketId: {
          startsWith: "TCK-LOCAL-",
        },
      },
    });

    const legacyDevices = await tx.device.deleteMany({
      where: {
        id: {
          startsWith: "seed_device_",
        },
      },
    });

    const legacyUsers = await tx.user.deleteMany({
      where: {
        OR: [
          {
            id: {
              in: [...LEGACY_LOCAL_SEED_USER_IDS],
            },
          },
          {
            email: {
              in: [...LEGACY_LOCAL_SEED_EMAILS],
            },
          },
        ],
        NOT: {
          email: BOOTSTRAP_ADMIN_EMAIL,
        },
      },
    });

    await tx.user.upsert({
      where: { email: bootstrapAdmin.email },
      update: {
        fullName: bootstrapAdmin.fullName,
        universityId: bootstrapAdmin.universityId,
        faculty: bootstrapAdmin.faculty,
        department: bootstrapAdmin.department,
        phone: bootstrapAdmin.phone,
        passwordHash: bootstrapAdmin.passwordHash,
        role: bootstrapAdmin.role,
        isActive: bootstrapAdmin.isActive,
      },
      create: bootstrapAdmin,
    });

    return {
      legacyRepairTickets: legacyRepairTickets.count,
      legacyDevices: legacyDevices.count,
      legacyUsers: legacyUsers.count,
    };
  });

  console.log("Bootstrap admin seed applied.");
  console.log(`Admin email: ${BOOTSTRAP_ADMIN_EMAIL}`);
  console.log(
    `Password: ${usesConfiguredPassword ? `from ${BOOTSTRAP_ADMIN_PASSWORD_ENV}` : BOOTSTRAP_ADMIN_DEFAULT_PASSWORD}`,
  );
  console.log(
    `Legacy local seeds removed: ${cleanup.legacyUsers} users, ${cleanup.legacyDevices} devices, ${cleanup.legacyRepairTickets} tickets.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Prisma seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
