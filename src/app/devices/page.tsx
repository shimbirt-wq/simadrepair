import Link from "next/link";
import { redirect } from "next/navigation";
import { DeviceForm } from "@/app/devices/device-form";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { listDevices } from "@/lib/devices/device-service";

export default async function DevicesPage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/devices");
  }

  const result = await listDevices(prisma, user, {
    page: 1,
    pageSize: 10,
    query: undefined,
    ownerId: user.id,
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <DeviceForm />

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">My devices</p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Registered devices</h1>
            </div>
            {user.role === "ADMIN" ? (
              <Link
                href="/admin/devices"
                className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Admin lookup
              </Link>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4">
            {result.devices.length > 0 ? (
              result.devices.map((device) => (
                <article key={device.id} className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">
                        {device.brand} {device.model}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">{device.deviceType}</p>
                    </div>
                    <Link
                      href={`/devices/${device.id}`}
                      className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
                    >
                      View device
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-[var(--muted)]">
                    Serial number: {device.serialNumber ?? "Not provided"}
                  </p>
                </article>
              ))
            ) : (
              <article className="rounded-3xl border border-[var(--border)] bg-white p-5">
                <p className="text-sm text-[var(--muted)]">No devices registered yet.</p>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
