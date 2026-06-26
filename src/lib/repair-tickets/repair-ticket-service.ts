import { RepairStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import { canTransitionRepairStatus, REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import type { AssignRepairTicketInput, CreateRepairTicketInput, UpdateRepairTicketStatusInput } from "@/lib/validations/repair-ticket";
import type { RepairTicketListQuery } from "@/lib/validations/repair-ticket-filters";

export type PublicRepairTicket = {
  id: string;
  ticketId: string;
  deviceId: string;
  technicianId: string | null;
  issueDescription: string;
  photoUrl: string | null;
  status: RepairStatus;
  createdAt: Date;
  updatedAt: Date;
  device: {
    id: string;
    ownerId: string | null;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
  };
};

export type RepairTicketDetail = PublicRepairTicket & {
  technician: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  events: Array<{
    id: string;
    eventType: string;
    status: RepairStatus;
    note: string | null;
    createdAt: Date;
    actor: {
      id: string;
      fullName: string;
      email: string;
    } | null;
  }>;
  device: PublicRepairTicket["device"] & {
    owner: {
      id: string;
      fullName: string;
      email: string;
      universityId: string | null;
    } | null;
  };
  requester?: {
    fullName: string;
  } | null;
};

export type RepairTicketListResult = {
  tickets: PublicRepairTicket[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

const publicRepairTicketSelect = {
  id: true,
  ticketId: true,
  deviceId: true,
  technicianId: true,
  issueDescription: true,
  photoUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  device: {
    select: {
      id: true,
      ownerId: true,
      deviceType: true,
      brand: true,
      model: true,
      serialNumber: true,
    },
  },
} as const;

const repairTicketDetailSelect = {
  ...publicRepairTicketSelect,
  technician: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  requester: {
    select: {
      fullName: true,
    },
  },
  device: {
    select: {
      id: true,
      ownerId: true,
      deviceType: true,
      brand: true,
      model: true,
      serialNumber: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          universityId: true,
        },
      },
    },
  },
  events: {
    select: {
      id: true,
      eventType: true,
      statusTo: true,
      note: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
};

function toPublicRepairTicket(
  ticket: {
    id: string;
    ticketId: string;
    deviceId: string;
    technicianId: string | null;
    issueDescription: string;
    photoUrl: string | null;
    status: RepairStatus;
    createdAt: Date;
    updatedAt: Date;
    device: {
      id: string;
      ownerId: string | null;
      deviceType: string;
      brand: string;
      model: string;
      serialNumber: string | null;
    };
  },
): PublicRepairTicket {
  return ticket;
}

function toRepairTicketDetail(
  ticket: {
    id: string;
    ticketId: string;
    deviceId: string;
    technicianId: string | null;
    issueDescription: string;
    photoUrl: string | null;
    status: RepairStatus;
    createdAt: Date;
    updatedAt: Date;
    technician: {
      id: string;
      fullName: string;
      email: string;
    } | null;
    requester?: {
      fullName: string;
    } | null;
    device: {
      id: string;
      ownerId: string | null;
      deviceType: string;
      brand: string;
      model: string;
      serialNumber: string | null;
      owner: {
        id: string;
        fullName: string;
        email: string;
        universityId: string | null;
      } | null;
    };
    events: Array<{
      id: string;
      eventType: string;
      statusTo: string | null;
      note: string | null;
      createdAt: Date;
      actor: {
        id: string;
        fullName: string;
        email: string;
      } | null;
    }>;
  },
): RepairTicketDetail {
  return {
    ...ticket,
    events: ticket.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      status: (event.statusTo as RepairStatus | null) ?? ticket.status,
      note: event.note,
      createdAt: event.createdAt,
      actor: event.actor,
    })),
    device: {
      ...ticket.device,
      ownerId: ticket.device.ownerId,
      owner: ticket.device.owner ?? null,
    },
  };
}

function buildDateRangeFilter(input: RepairTicketListQuery) {
  if (!input.dateFrom && !input.dateTo) {
    return {};
  }

  return {
    createdAt: {
      ...(input.dateFrom ? { gte: new Date(`${input.dateFrom}T00:00:00.000Z`) } : {}),
      ...(input.dateTo ? { lte: new Date(`${input.dateTo}T23:59:59.999Z`) } : {}),
    },
  };
}

function buildTicketFilter(input: RepairTicketListQuery) {
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.ticketId ? { ticketId: { contains: input.ticketId, mode: "insensitive" as const } } : {}),
    ...buildDateRangeFilter(input),
  };
}

function generateTicketId() {
  const dateSegment = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomSegment = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `TCK-${dateSegment}-${randomSegment}`;
}

async function createTicketId(tx: PrismaClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticketId = generateTicketId();
    const existingTicket = await tx.repairTicket.findUnique({
      where: { ticketId },
      select: { id: true },
    });

    if (!existingTicket) {
      return ticketId;
    }
  }

  throw new Error("Unable to generate a unique ticket ID.");
}

export async function createRepairTicket(
  prisma: PrismaClient,
  user: PublicUser,
  input: CreateRepairTicketInput,
): Promise<
  | {
      ok: true;
      ticket: PublicRepairTicket;
    }
  | {
      ok: false;
      status: 403 | 404;
      message: string;
    }
> {
  const device = await prisma.device.findUnique({
    where: { id: input.deviceId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!device) {
    return {
      ok: false,
      status: 404,
      message: "Device not found.",
    };
  }

  if (device.ownerId !== user.id) {
    return {
      ok: false,
      status: 403,
      message: "You can only create tickets for your own devices.",
    };
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const ticketId = await createTicketId(tx as unknown as PrismaClient);

    const createdTicket = await tx.repairTicket.create({
      data: {
        ticketId,
        deviceId: input.deviceId,
        issueDescription: input.issueDescription,
        photoUrl: input.photoUrl ?? null,
        status: "REGISTRATION_COMPLETED",
      },
      select: publicRepairTicketSelect,
    });

    await tx.repairEvent.create({
      data: {
        ticketId: createdTicket.id,
        actorId: null,
        actorRole: null,
        eventType: "TICKET_CREATED",
        statusFrom: null,
        statusTo: "REGISTRATION_COMPLETED",
        note: "Repair ticket registered.",
        metadata: {
          source: "repair_ticket_service",
        },
      },
    });

    return createdTicket;
  });

  return {
    ok: true,
    ticket: toPublicRepairTicket(ticket),
  };
}

export async function listOwnedRepairTickets(prisma: PrismaClient, user: PublicUser) {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      device: {
        ownerId: user.id,
      },
    },
    select: publicRepairTicketSelect,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 10,
  });

  return tickets.map(toPublicRepairTicket);
}

export async function listRepairTickets(
  prisma: PrismaClient,
  user: PublicUser,
  input: RepairTicketListQuery,
): Promise<RepairTicketListResult> {
  const baseFilter = buildTicketFilter(input);
  const skip = (input.page - 1) * input.pageSize;

  const where =
    user.role === "ADMIN" || user.role === "LEAD_TECHNICIAN"
      ? {
          ...baseFilter,
          device: {
            ownerId: { not: null },
          },
        }
      : user.role === "TECHNICIAN"
        ? {
            ...baseFilter,
            technicianId: user.id,
          }
        : (() => { throw new Error("listRepairTickets: unexpected role"); })();

  const [tickets, totalItems] = await Promise.all([
    prisma.repairTicket.findMany({
      where,
      select: publicRepairTicketSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: input.pageSize,
    }),
    prisma.repairTicket.count({ where }),
  ]);

  return {
    tickets: tickets.map(toPublicRepairTicket),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
    },
  };
}

export async function getRepairTicketDetail(
  prisma: PrismaClient,
  user: PublicUser,
  ticketId: string,
): Promise<
  | {
      ok: true;
      ticket: RepairTicketDetail;
    }
  | {
      ok: false;
      status: 403 | 404;
      message: string;
    }
> {
  const ticket = await prisma.repairTicket.findUnique({
    where: { id: ticketId },
    select: repairTicketDetailSelect,
  });

  if (!ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  const assignedTechnicianId = ticket.technicianId;

  if (user.role === "ADMIN" || user.role === "LEAD_TECHNICIAN") {
    return {
      ok: true,
      ticket: toRepairTicketDetail(ticket),
    };
  }

  if (user.role === "TECHNICIAN" && assignedTechnicianId === user.id) {
    return {
      ok: true,
      ticket: toRepairTicketDetail(ticket),
    };
  }

  return {
    ok: false,
    status: 403,
    message: "You do not have permission to access this repair ticket.",
  };
}

export async function assignTechnicianToRepairTicket(
  prisma: PrismaClient,
  user: PublicUser,
  ticketId: string,
  input: AssignRepairTicketInput,
): Promise<
  | {
      ok: true;
      ticket: RepairTicketDetail;
    }
  | {
      ok: false;
      status: 403 | 404 | 409;
      message: string;
    }
> {
  if (user.role !== "ADMIN") {
    return {
      ok: false,
      status: 403,
      message: "Only admins can assign technicians to repair tickets.",
    };
  }

  const [ticket, technician] = await Promise.all([
    prisma.repairTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketId: true,
        status: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: input.technicianId },
      select: {
        id: true,
        fullName: true,
        role: true,
      },
    }),
  ]);

  if (!ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  if (!technician) {
    return {
      ok: false,
      status: 404,
      message: "Technician not found.",
    };
  }

  if (technician.role !== "TECHNICIAN") {
    return {
      ok: false,
      status: 409,
      message: "Only users with technician role can be assigned repair tickets.",
    };
  }

  const updatedTicket = await prisma.$transaction(async (tx) => {
    await tx.repairTicket.update({
      where: { id: ticketId },
      data: {
        technicianId: technician.id,
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        actorRole: user.role,
        eventType: "TECHNICIAN_ASSIGNED",
        statusFrom: ticket.status,
        statusTo: ticket.status,
        note: `Ticket assigned to technician ${technician.fullName}.`,
        metadata: {
          technicianId: technician.id,
          source: "repair_ticket_service",
        },
      },
    });

    return tx.repairTicket.findUnique({
      where: { id: ticketId },
      select: repairTicketDetailSelect,
    });
  });

  if (!updatedTicket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  return {
    ok: true,
    ticket: toRepairTicketDetail(updatedTicket),
  };
}

export async function updateRepairTicketStatus(
  prisma: PrismaClient,
  user: PublicUser,
  ticketId: string,
  input: UpdateRepairTicketStatusInput,
): Promise<
  | {
      ok: true;
      ticket: RepairTicketDetail;
    }
  | {
      ok: false;
      status: 403 | 404 | 409;
      message: string;
    }
> {
  const ticket = await prisma.repairTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      ticketId: true,
      status: true,
      technicianId: true,
      device: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  const isAdmin = user.role === "ADMIN";
  const isAssignedTechnician = user.role === "TECHNICIAN" && ticket.technicianId === user.id;

  if (!isAdmin && !isAssignedTechnician) {
    return {
      ok: false,
      status: 403,
      message: "Only the assigned technician or an admin can update ticket status.",
    };
  }

  if (!canTransitionRepairStatus(ticket.status, input.status)) {
    return {
      ok: false,
      status: 409,
      message: "Repair ticket status must follow the next step in the repair journey.",
    };
  }

  const updatedTicket = await prisma.$transaction(async (tx) => {
    await tx.repairTicket.update({
      where: { id: ticketId },
      data: {
        status: input.status,
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        actorRole: user.role,
        eventType: input.status === "READY_FOR_COLLECTION" ? "READY_FOR_PICKUP" : "STATUS_CHANGED",
        statusFrom: ticket.status,
        statusTo: input.status,
        note: `Status changed from ${REPAIR_STATUS_LABELS[ticket.status]} to ${REPAIR_STATUS_LABELS[input.status]}.`,
        metadata: {
          source: "repair_ticket_service",
        },
      },
    });

    return tx.repairTicket.findUnique({
      where: { id: ticketId },
      select: repairTicketDetailSelect,
    });
  });

  if (!updatedTicket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  return {
    ok: true,
    ticket: toRepairTicketDetail(updatedTicket),
  };
}

