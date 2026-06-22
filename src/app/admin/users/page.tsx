import Link from "next/link";
import { AppShell } from "@/app/app-shell";
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
    <AppShell
      active="users"
      eyebrow="Admin users"
      title="User management"
      user={currentUser}
      actions={
        <Link href="/admin/users/new" className="btn-primary">
          Create Staff Account
        </Link>
      }
    >
      <section className="panel p-6">
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Search by name, email, or university ID, then open a user record to review safe public fields and update roles.
        </p>

        <form className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 sm:flex-row">
          <input
            type="search"
            name="query"
            defaultValue={parsedQuery.query ?? ""}
            placeholder="Search by name, email, or university ID"
            className="field-control min-w-0 flex-1"
          />
          <input type="hidden" name="pageSize" value={String(parsedQuery.pageSize)} />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        <div className="mt-8 overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="min-w-full border-collapse bg-white">
            <thead className="bg-[var(--surface-alt)]">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">User</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Role</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">University ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {result.users.map((user) => (
                <tr key={user.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{user.fullName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="status-badge status-received">{user.role}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`status-badge ${user.isActive ? "status-ready" : "status-registration"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--foreground)]">{user.universityId ?? "Not provided"}</td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/users/${user.id}`} className="btn-secondary">
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
            Page {result.pagination.page} of {result.pagination.totalPages} - {result.pagination.totalItems} users
          </p>
          <div className="flex gap-3">
            {result.pagination.page > 1 ? (
              <Link href={`/admin/users?page=${result.pagination.page - 1}&pageSize=${result.pagination.pageSize}&query=${encodeURIComponent(parsedQuery.query ?? "")}`} className="btn-secondary">
                Previous
              </Link>
            ) : null}
            {result.pagination.page < result.pagination.totalPages ? (
              <Link href={`/admin/users?page=${result.pagination.page + 1}&pageSize=${result.pagination.pageSize}&query=${encodeURIComponent(parsedQuery.query ?? "")}`} className="btn-secondary">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
