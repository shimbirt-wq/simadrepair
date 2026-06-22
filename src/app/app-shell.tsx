import Link from "next/link";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import type { PublicUser } from "@/lib/auth/public-user";
import { ROLE_LABELS, isInternalUserRole } from "@/lib/auth/roles";
import { LogoutButton } from "@/app/logout-button";

type AppShellProps = {
  active: "dashboard" | "lead" | "technician" | "tickets" | "devices" | "reports" | "users" | "profile";
  actions?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  user: PublicUser;
};

function getNavItems(user: PublicUser) {
  if (!isInternalUserRole(user.role)) {
    return [] as const;
  }

  if (user.role === "LEAD_TECHNICIAN") {
    return [
      { key: "dashboard", href: "/dashboard", label: "Dashboard" },
      { key: "lead", href: "/lead", label: "Command Center" },
      { key: "tickets", href: "/repair-tickets", label: "Queues" },
      { key: "devices", href: "/devices", label: "Device Custody" },
      { key: "reports", href: "/admin/service-desk/reports", label: "Reports" },
      { key: "users", href: "/admin/users/new", label: "Add Technician" },
      { key: "profile", href: "/profile", label: "Profile" },
    ] as const;
  }

  if (user.role === "TECHNICIAN") {
    return [
      { key: "dashboard", href: "/dashboard", label: "My Queue" },
      { key: "technician", href: "/technician/workspace", label: "Assigned Tickets" },
      { key: "tickets", href: "/repair-tickets", label: "History" },
      { key: "profile", href: "/profile", label: "Profile" },
    ] as const;
  }

  return [
    { key: "dashboard", href: "/dashboard", label: "Overview" },
    { key: "reports", href: "/admin/service-desk/reports", label: "Reports" },
    { key: "users", href: "/admin/users", label: "Staff" },
    { key: "devices", href: "/admin/devices", label: "Devices" },
    { key: "tickets", href: "/repair-tickets", label: "Tickets" },
    { key: "profile", href: "/profile", label: "Profile" },
  ] as const;
}

export function AppShell({ active, actions, children, eyebrow, title, user }: AppShellProps) {
  const navItems = getNavItems(user);
  const operationsNavItems = navItems.filter((item) =>
    ["dashboard", "lead", "technician", "tickets"].includes(item.key),
  );
  const managementNavItems = navItems.filter((item) =>
    ["devices", "reports", "users", "profile"].includes(item.key),
  );

  return (
    <main className="ops-shell">
      <div className="ops-layout">
        <aside className="ops-sidebar">
          <Link href="/dashboard" className="ops-brand">
            <SimadRepairLogo variant="light" className="h-12 w-auto" />
          </Link>

          <nav className="grid gap-5">
            <div className="ops-sidebar-section">
              <p className="ops-sidebar-label">Operations</p>
              {operationsNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`ops-nav-link ${active === item.key ? "ops-nav-link-active" : ""}`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="ops-sidebar-section">
              <p className="ops-sidebar-label">Manage</p>
              {managementNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`ops-nav-link ${active === item.key ? "ops-nav-link-active" : ""}`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
              <LogoutButton />
            </div>
          </nav>

          <div className="mt-auto rounded-md border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-bold text-white">{user.fullName}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--slate-400)]">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </aside>

        <section className="ops-main">
          <header className="ops-topbar">
            <div>
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h1 className="mt-1 text-[22px] font-semibold leading-snug text-[var(--foreground)]">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {actions}
              <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm shadow-[var(--shadow-xs)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--slate-100)] text-xs font-bold text-[var(--slate-700)]">
                  {user.fullName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span>
                  <span className="block text-xs font-bold leading-tight text-[var(--foreground)]">{user.fullName}</span>
                  <span className="block text-[11px] font-medium leading-tight text-[var(--muted)]">{ROLE_LABELS[user.role]}</span>
                </span>
              </div>
            </div>
          </header>
          <div className="ops-content">{children}</div>
        </section>
      </div>
    </main>
  );
}
