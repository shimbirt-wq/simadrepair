import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
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
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-14">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Device detail</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {device.brand} {device.model}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              This device remains separate from repair tickets so its repair history can accumulate over time.
            </p>
          </div>
          <Link
            href="/devices"
            className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
          >
            Back to devices
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Device type</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{device.deviceType}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Serial number</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{device.serialNumber ?? "Not provided"}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Owner</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{device.owner.fullName}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Owner email</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{device.owner.email}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
