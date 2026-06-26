import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
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
    fullName: "Technician User",
    universityId: "SIMAD-TICKET-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "tech@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function buildMultipartRequest(token: string, file: File) {
  const formData = new FormData();
  formData.set("photo", file);

  return new Request("http://localhost/api/uploads/repair-ticket-photo", {
    method: "POST",
    headers: {
      cookie: `simadrepair_session=${token}`,
    },
    body: formData,
  });
}

describe("upload route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uploads a valid image to configured object storage", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    vi.stubEnv("SUPABASE_URL", "https://supabase.example.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("UPLOAD_BUCKET", "repair-ticket-photos");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const token = await signSessionToken({ id: "user_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { POST } = await import("./repair-ticket-photo/route");

    const response = await POST(
      await buildMultipartRequest(token, new File(["image-bytes"], "Device Photo.PNG", { type: "image/png" })),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.upload.photoUrl).toMatch(/^repair-ticket-photos\/user_123\/[a-f0-9-]+-device-photo\.png$/);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/supabase\.example\.invalid\/storage\/v1\/object\/repair-ticket-photos\/user_123\//),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          authorization: "Bearer service-role-key",
          "content-type": "image/png",
        }),
      }),
    );
  });

  it("rejects invalid image types before storage upload", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    vi.stubEnv("SUPABASE_URL", "https://supabase.example.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const token = await signSessionToken({ id: "user_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { POST } = await import("./repair-ticket-photo/route");

    const response = await POST(await buildMultipartRequest(token, new File(["bad"], "script.js", { type: "image/png" })));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Only JPG, PNG, and WebP image uploads are allowed.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires authentication for photo uploads", async () => {
    const { POST } = await import("./repair-ticket-photo/route");

    const response = await POST(
      await buildMultipartRequest("", new File(["image-bytes"], "device-photo.png", { type: "image/png" })),
    );

    expect(response.status).toBe(401);
  });
});

