import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RoleUpdateForm } from "@/app/admin/users/role-update-form";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { getUserById } from "@/lib/users/user-service";

type PageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const currentUser = await getCurrentServerUser();

  if (!currentUser) {
    const { userId } = await params;
    redirect(`/auth/login?next=/admin/users/${userId}`);
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/profile?denied=admin-users");
  }
  const { userId } = await params;
  const user = await getUserById(prisma, userId);

  if (!user) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-14">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Admin user detail</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{user.fullName}</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Review the public profile fields below and update the access role safely when needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/users"
              className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
            >
              Back to list
            </Link>
            <Link
              href={`/api/users/${user.id}`}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Open JSON
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Email</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{user.email}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Current role</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{user.role}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">University ID</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{user.universityId ?? "Not provided"}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Phone</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{user.phone ?? "Not provided"}</p>
          </article>
        </div>

        <div className="mt-8">
          <RoleUpdateForm currentRole={user.role} userId={user.id} />
        </div>
      </section>
    </main>
  );
}
