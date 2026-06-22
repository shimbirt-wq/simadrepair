import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { redirect } from "next/navigation";
import { DeviceForm } from "@/app/devices/device-form";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { isInternalUserRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { listDevices } from "@/lib/devices/device-service";

export default async function DevicesPage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/devices");
  }

  if (!isInternalUserRole(user.role)) {
    redirect("/request-repair");
  }

  const result = await listDevices(prisma, user, {
    page: 1,
    pageSize: 10,
    query: undefined,
    ownerId: user.id,
  });

  return (
    <AppShell
      active="devices"
      eyebrow="Devices"
      title="Registered devices"
      user={user}
      actions={
        user.role === "ADMIN" ? (
          <Link href="/admin/devices" className="btn-secondary">
            Admin lookup
          </Link>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <DeviceForm />

        <section className="panel p-6">
          <div className="mt-8 grid gap-4">
            {result.devices.length > 0 ? (
              result.devices.map((device) => (
                <article key={device.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">
                        {device.brand} {device.model}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">{device.deviceType}</p>
                    </div>
                    <Link
                      href={`/devices/${device.id}`}
                      className="btn-secondary"
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
              <article className="panel p-5">
                <p className="text-sm text-[var(--muted)]">No devices registered yet.</p>
              </article>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
