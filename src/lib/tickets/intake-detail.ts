import { Prisma } from "@prisma/client";
import { describeAnswers, PROBLEM_CATEGORIES, RECENT_EVENTS, STARTED_WHEN } from "@/lib/intake/diagnosis";
import { ACCESSORIES, DEVICE_AGES, OPERATING_SYSTEMS, RAM_SIZES, STORAGE_TYPES, labelOf } from "@/lib/intake/options";

/** Everything the requester told us, ready for staff screens. */
export const intakeDetailSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  issueDescription: true,
  problemCategories: true,
  problemAnswers: true,
  startedWhen: true,
  recentEvents: true,
  errorMessage: true,
  accessoriesLeft: true,
  wipeAllowed: true,
  needsPassword: true,
  device: { select: { deviceType: true, brand: true, model: true, serialNumber: true, operatingSystem: true, ram: true, storageType: true, ageBand: true } },
  photos: { select: { id: true, kind: true }, orderBy: { createdAt: "asc" } },
});

type IntakeRecord = Prisma.RepairTicketGetPayload<{ select: typeof intakeDetailSelect }>;

export type IntakeDetail = {
  device: { name: string; type: string; serialNumber: string | null; specs: string[]; age: string | null };
  categories: string[];
  answers: Array<{ category: string; question: string; answer: string }>;
  startedWhen: string | null;
  recentEvents: string[];
  errorMessage: string | null;
  description: string;
  accessories: string[];
  accessoryValues: string[];
  wipeAllowed: boolean;
  needsPassword: boolean;
  photos: Array<{ id: string; kind: "REQUESTER" | "DAMAGE"; url: string }>;
};

export function toIntakeDetail(ticket: IntakeRecord): IntakeDetail {
  const { device } = ticket;
  const specs = [
    device.operatingSystem && device.operatingSystem !== "UNKNOWN" ? labelOf(OPERATING_SYSTEMS, device.operatingSystem) : null,
    device.ram && device.ram !== "UNKNOWN" ? `${labelOf(RAM_SIZES, device.ram)} RAM` : null,
    device.storageType && device.storageType !== "UNKNOWN" ? labelOf(STORAGE_TYPES, device.storageType) : null,
  ].filter((value): value is string => Boolean(value));

  return {
    device: {
      name: `${device.brand} ${device.model}`,
      type: device.deviceType,
      serialNumber: device.serialNumber,
      specs,
      age: device.ageBand ? labelOf(DEVICE_AGES, device.ageBand) : null,
    },
    categories: ticket.problemCategories.map((value) => PROBLEM_CATEGORIES.find((category) => category.value === value)?.label ?? value),
    answers: describeAnswers(ticket.problemCategories, ticket.problemAnswers),
    startedWhen: ticket.startedWhen ? labelOf(STARTED_WHEN, ticket.startedWhen) : null,
    recentEvents: ticket.recentEvents.filter((value) => value !== "NONE").map((value) => labelOf(RECENT_EVENTS, value)),
    errorMessage: ticket.errorMessage,
    description: ticket.issueDescription,
    accessories: ticket.accessoriesLeft.map((value) => labelOf(ACCESSORIES, value)),
    accessoryValues: ticket.accessoriesLeft,
    wipeAllowed: ticket.wipeAllowed,
    needsPassword: ticket.needsPassword,
    photos: ticket.photos.map((photo) => ({ id: photo.id, kind: photo.kind, url: `/api/staff/photos/${photo.id}` })),
  };
}

export async function getIntakeDetail(prisma: Prisma.TransactionClient | import("@prisma/client").PrismaClient, ticketId: string) {
  const ticket = await prisma.repairTicket.findUnique({ where: { id: ticketId }, select: intakeDetailSelect });
  return ticket ? toIntakeDetail(ticket) : null;
}
