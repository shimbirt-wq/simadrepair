import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import type { CreateDeviceInput, DeviceListQuery } from "@/lib/validations/devices";

export type PublicDevice = {
  id: string;
  ownerId: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    fullName: string;
    email: string;
    universityId: string | null;
  };
};

export type DeviceListResult = {
  devices: PublicDevice[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

const publicDeviceSelect = {
  id: true,
  ownerId: true,
  deviceType: true,
  brand: true,
  model: true,
  serialNumber: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
      universityId: true,
    },
  },
} as const;

function buildDeviceSearchFilter(query?: string) {
  if (!query) {
    return {};
  }

  return {
    OR: [
      { deviceType: { contains: query, mode: "insensitive" as const } },
      { brand: { contains: query, mode: "insensitive" as const } },
      { model: { contains: query, mode: "insensitive" as const } },
      { serialNumber: { contains: query, mode: "insensitive" as const } },
      { owner: { fullName: { contains: query, mode: "insensitive" as const } } },
      { owner: { email: { contains: query, mode: "insensitive" as const } } },
      { owner: { universityId: { contains: query, mode: "insensitive" as const } } },
    ],
  };
}

function toPublicDevice(
  device: {
    id: string;
    ownerId: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
    owner: {
      id: string;
      fullName: string;
      email: string;
      universityId: string | null;
    };
  },
): PublicDevice {
  return device;
}

export async function createDevice(
  prisma: PrismaClient,
  user: PublicUser,
  input: CreateDeviceInput,
): Promise<
  | {
      ok: true;
      device: PublicDevice;
    }
  | {
      ok: false;
      status: 403;
      message: string;
    }
> {
  const ownerId = user.role === "ADMIN" && input.ownerId ? input.ownerId : user.id;

  if (user.role !== "ADMIN" && input.ownerId && input.ownerId !== user.id) {
    return {
      ok: false,
      status: 403,
      message: "You can only create devices for your own account.",
    };
  }

  const device = await prisma.device.create({
    data: {
      ownerId,
      deviceType: input.deviceType,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber ?? null,
    },
    select: publicDeviceSelect,
  });

  return {
    ok: true,
    device: toPublicDevice(device),
  };
}

export async function listDevices(
  prisma: PrismaClient,
  user: PublicUser,
  input: DeviceListQuery,
): Promise<DeviceListResult> {
  const skip = (input.page - 1) * input.pageSize;
  const searchFilter = buildDeviceSearchFilter(input.query);
  const where =
    user.role === "ADMIN"
      ? {
          ...searchFilter,
          ...(input.ownerId ? { ownerId: input.ownerId } : {}),
        }
      : {
          ownerId: user.id,
          ...searchFilter,
        };

  const [devices, totalItems] = await Promise.all([
    prisma.device.findMany({
      where,
      select: publicDeviceSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: input.pageSize,
    }),
    prisma.device.count({ where }),
  ]);

  return {
    devices: devices.map(toPublicDevice),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
    },
  };
}

export async function getDeviceById(
  prisma: PrismaClient,
  user: PublicUser,
  deviceId: string,
): Promise<
  | {
      ok: true;
      device: PublicDevice;
    }
  | {
      ok: false;
      status: 403 | 404;
      message: string;
    }
> {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: publicDeviceSelect,
  });

  if (!device) {
    return {
      ok: false,
      status: 404,
      message: "Device not found.",
    };
  }

  if (user.role !== "ADMIN" && device.ownerId !== user.id) {
    return {
      ok: false,
      status: 403,
      message: "You do not have permission to access this device.",
    };
  }

  return {
    ok: true,
    device: toPublicDevice(device),
  };
}
