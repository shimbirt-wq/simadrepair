import { PrismaClient } from "@prisma/client";
import { buildLocalSeedData, hashLocalSeedPassword, LOCAL_SEED_LOGIN_ACCOUNTS, LOCAL_SEED_PASSWORD } from "./seed-helpers";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashLocalSeedPassword();
  const seedData = buildLocalSeedData(passwordHash);

  for (const user of seedData.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        fullName: user.fullName,
        email: user.email,
        universityId: user.universityId,
        faculty: user.faculty,
        department: user.department,
        phone: user.phone,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: user.isActive,
      },
      create: user,
    });
  }

  for (const device of seedData.devices) {
    await prisma.device.upsert({
      where: { id: device.id },
      update: {
        ownerId: device.ownerId,
        deviceType: device.deviceType,
        brand: device.brand,
        model: device.model,
        serialNumber: device.serialNumber,
      },
      create: device,
    });
  }

  for (const ticket of seedData.repairTickets) {
    await prisma.repairTicket.upsert({
      where: { ticketId: ticket.ticketId },
      update: {
        deviceId: ticket.deviceId,
        technicianId: ticket.technicianId,
        issueDescription: ticket.issueDescription,
        status: ticket.status,
      },
      create: ticket,
    });
  }

  for (const log of seedData.repairLogs) {
    await prisma.repairLog.upsert({
      where: { id: log.id },
      update: {
        ticketId: log.ticketId,
        technicianId: log.technicianId,
        status: log.status,
        diagnosis: log.diagnosis,
        repairNotes: log.repairNotes,
      },
      create: log,
    });
  }

  for (const activity of seedData.technicianActivity) {
    await prisma.technicianActivity.upsert({
      where: { id: activity.id },
      update: {
        technicianId: activity.technicianId,
        checkIn: activity.checkIn,
        checkOut: activity.checkOut,
        repairsCompleted: activity.repairsCompleted,
      },
      create: activity,
    });
  }

  for (const notification of seedData.notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {
        userId: notification.userId,
        ticketId: notification.ticketId,
        channel: notification.channel,
        status: notification.status,
        title: notification.title,
        message: notification.message,
      },
      create: notification,
    });
  }

  console.log("Local seed data inserted.");
  console.log(`Local seed password for all sample users: ${LOCAL_SEED_PASSWORD}`);
  console.log("Local seed login accounts:");
  for (const account of LOCAL_SEED_LOGIN_ACCOUNTS) {
    console.log(`- ${account.label}: ${account.email}`);
  }
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
