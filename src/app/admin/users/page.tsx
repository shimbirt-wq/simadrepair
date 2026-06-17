import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { listUsers } from "@/lib/users/user-service";
import { userListQuerySchema } from "@/lib/validations/users";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentServerUser();

  if (!currentUser) {
    redirect("/auth/login?next=/admin/users");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/profile?denied=admin-users");
  }

  const params = await searchParams;
  const parsedQuery = userListQuerySchema.parse({
    page: readSearchParam(params.page),
    pageSize: readSearchParam(params.pageSize),
    query: readSearchParam(params.query),
  });

  const result = await listUsers(prisma, parsedQuery);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Admin users</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">User management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Search by name, email, or university ID, then open a user record to review safe public fields and update
              roles.
            </p>
          </div>
          <Link
            href="/api/users"
            className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
          >
            JSON endpoint
          </Link>
        </div>

        <form className="mt-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 sm:flex-row">
          <input
            type="search"
            name="query"
            defaultValue={parsedQuery.query ?? ""}
            placeholder="Search by name, email, or university ID"
            className="min-w-0 flex-1 rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
          <input type="hidden" name="pageSize" value={String(parsedQuery.pageSize)} />
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
                  User
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Role
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  University ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {result.users.map((user) => (
                <tr key={user.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{user.fullName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--foreground)]">{user.role}</td>
                  <td className="px-4 py-4 text-sm text-[var(--foreground)]">{user.universityId ?? "Not provided"}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
                    >
                      Open user
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <p>
            Page {result.pagination.page} of {result.pagination.totalPages} · {result.pagination.totalItems} users
          </p>
          <div className="flex gap-3">
            {result.pagination.page > 1 ? (
              <Link
                href={`/admin/users?page=${result.pagination.page - 1}&pageSize=${result.pagination.pageSize}&query=${encodeURIComponent(parsedQuery.query ?? "")}`}
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Previous
              </Link>
            ) : null}
            {result.pagination.page < result.pagination.totalPages ? (
              <Link
                href={`/admin/users?page=${result.pagination.page + 1}&pageSize=${result.pagination.pageSize}&query=${encodeURIComponent(parsedQuery.query ?? "")}`}
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
