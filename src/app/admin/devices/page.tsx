import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { listDevices } from "@/lib/devices/device-service";
import { deviceListQuerySchema } from "@/lib/validations/devices";

type AdminDevicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDevicesPage({ searchParams }: AdminDevicesPageProps) {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/admin/devices");
  }

  if (user.role !== "ADMIN") {
    redirect("/devices");
  }

  const params = await searchParams;
  const query = deviceListQuerySchema.parse({
    page: readSearchParam(params.page),
    pageSize: readSearchParam(params.pageSize),
    query: readSearchParam(params.query),
    ownerId: readSearchParam(params.ownerId),
  });

  const result = await listDevices(prisma, user, query);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Admin devices</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Device lookup</h1>
          </div>
          <Link
            href="/devices"
            className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
          >
            My devices
          </Link>
        </div>

        <form className="mt-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 sm:flex-row">
          <input
            type="search"
            name="query"
            defaultValue={query.query ?? ""}
            placeholder="Search by owner, brand, model, or serial number"
            className="min-w-0 flex-1 rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
          <input type="hidden" name="pageSize" value={String(query.pageSize)} />
          <button
            type="submit"
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Search
          </button>
        </form>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)]">
          <table className="min-w-full border-collapse bg-white">
            <thead className="bg-[var(--surface-alt)]">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Device
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Owner
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Serial
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {result.devices.map((device) => (
                <tr key={device.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{device.brand} {device.model}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{device.deviceType}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-[var(--foreground)]">{device.owner.fullName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{device.owner.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--foreground)]">{device.serialNumber ?? "Not provided"}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/devices/${device.id}`}
                      className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
                    >
                      Open device
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <p>
            Page {result.pagination.page} of {result.pagination.totalPages} · {result.pagination.totalItems} devices
          </p>
          <div className="flex gap-3">
            {result.pagination.page > 1 ? (
              <Link
                href={`/admin/devices?page=${result.pagination.page - 1}&pageSize=${result.pagination.pageSize}&query=${encodeURIComponent(query.query ?? "")}`}
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Previous
              </Link>
            ) : null}
            {result.pagination.page < result.pagination.totalPages ? (
              <Link
                href={`/admin/devices?page=${result.pagination.page + 1}&pageSize=${result.pagination.pageSize}&query=${encodeURIComponent(query.query ?? "")}`}
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
