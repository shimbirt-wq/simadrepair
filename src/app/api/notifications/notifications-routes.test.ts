import type { Notification, User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  notification: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Notification User",
    universityId: "SIMAD-NOTIFY-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "notify@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notification_123",
    userId: "user_123",
    ticketId: "ticket_123",
    channel: "DASHBOARD",
    status: "PENDING",
    title: "Ticket assigned",
    message: "A repair ticket has been assigned to you.",
    readAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("notification route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only the current user's notifications with unread count", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.notification.findMany.mockResolvedValue([
      buildNotification({ id: "notification_1" }),
      buildNotification({ id: "notification_2", status: "READ", readAt: now }),
    ]);
    mockPrisma.notification.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/notifications?page=1&pageSize=10", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_123",
        },
      }),
    );
    expect(body.notifications).toHaveLength(2);
    expect(body.unreadCount).toBe(1);
    vi.unstubAllEnvs();
  });

  it("marks the current user's notification as read", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.notification.findUnique.mockResolvedValue(buildNotification());
    mockPrisma.notification.update.mockResolvedValue(buildNotification({ status: "READ", readAt: now }));
    const { PATCH } = await import("./[notificationId]/read/route");

    const response = await PATCH(
      buildRequest("/api/notifications/notification_123/read", {
        method: "PATCH",
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
      { params: Promise.resolve({ notificationId: "notification_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "notification_123" },
        data: expect.objectContaining({
          status: "READ",
        }),
      }),
    );
    expect(body.notification.status).toBe("READ");
    vi.unstubAllEnvs();
  });

  it("rejects marking another user's notification as read", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.notification.findUnique.mockResolvedValue(buildNotification({ userId: "other_user" }));
    const { PATCH } = await import("./[notificationId]/read/route");

    const response = await PATCH(
      buildRequest("/api/notifications/notification_123/read", {
        method: "PATCH",
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
      { params: Promise.resolve({ notificationId: "notification_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You do not have permission to update this notification.");
    vi.unstubAllEnvs();
  });
});
