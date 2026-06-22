import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { notFound, redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { isInternalUserRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { getDeviceById } from "@/lib/devices/device-service";

type DeviceDetailPageProps = {
  params: Promise<{
    deviceId: string;
  }>;
};

export default async function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const user = await getCurrentServerUser();

  if (!user) {
    const { deviceId } = await params;
    redirect(`/auth/login?next=/devices/${deviceId}`);
  }

  if (!isInternalUserRole(user.role)) {
    redirect("/request-repair");
  }

  const { deviceId } = await params;
  const result = await getDeviceById(prisma, user, deviceId);

  if (!result.ok) {
    if (result.status === 404) {
      notFound();
    }

    redirect("/devices");
  }

  const { device } = result;

  return (
    <AppShell
      active="devices"
      eyebrow="Device detail"
      title={`${device.brand} ${device.model}`}
      user={user}
      actions={
        <Link href="/devices" className="btn-secondary">
          Back to devices
        </Link>
      }
    >
      <section className="panel p-6">
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          This device remains separate from repair tickets so its repair history can accumulate over time.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            ["Device type", device.deviceType],
            ["Serial number", device.serialNumber ?? "Not provided"],
            ["Owner", device.owner.fullName],
            ["Owner email", device.owner.email],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl border border-[var(--border)] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
              <p className="mt-3 text-base font-medium text-[var(--foreground)]">{value}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
