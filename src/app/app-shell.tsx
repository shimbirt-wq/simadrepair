import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart2,
  ChevronRight,
  Cpu,
  LayoutDashboard,
  ScrollText,
  Shield,
  Ticket,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import type { PublicUser } from "@/lib/auth/public-user";
import { ROLE_LABELS, isInternalUserRole } from "@/lib/auth/roles";
import { LogoutButton } from "@/app/logout-button";

type AppShellProps = {
  active: "dashboard" | "lead" | "technician" | "tickets" | "devices" | "reports" | "users" | "profile";
  actions?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
  user: PublicUser;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: ReactNode;
};

const iconProps = { size: 16, strokeWidth: 1.75 };

function getNavItems(user: PublicUser): { operations: NavItem[]; manage: NavItem[]; account: NavItem[] } {
  if (!isInternalUserRole(user.role)) {
    return { operations: [], manage: [], account: [] };
  }

  if (user.role === "LEAD_TECHNICIAN") {
    return {
      operations: [
        { key: "lead",      href: "/lead",                           label: "Command Center", icon: <Shield {...iconProps} /> },
        { key: "dashboard", href: "/dashboard",                      label: "Dashboard",      icon: <LayoutDashboard {...iconProps} /> },
        { key: "tickets",   href: "/repair-tickets",                 label: "Ticket Queue",   icon: <Ticket {...iconProps} /> },
        { key: "devices",   href: "/devices",                        label: "Device Custody", icon: <Cpu {...iconProps} /> },
        { key: "reports",   href: "/admin/service-desk/reports",     label: "Reports",        icon: <BarChart2 {...iconProps} /> },
      ],
      manage: [
        { key: "users", href: "/admin/users/new", label: "Add Technician", icon: <Users {...iconProps} /> },
      ],
      account: [
        { key: "profile",  href: "/profile",                          label: "Profile",        icon: <UserCircle {...iconProps} /> },
      ],
    };
  }

  if (user.role === "TECHNICIAN") {
    return {
      operations: [
        { key: "technician", href: "/technician/workspace", label: "Assigned Tickets", icon: <Wrench {...iconProps} /> },
        { key: "dashboard",  href: "/dashboard",            label: "My Queue",         icon: <LayoutDashboard {...iconProps} /> },
        { key: "tickets",    href: "/repair-tickets",       label: "History",          icon: <ScrollText {...iconProps} /> },
      ],
      manage: [],
      account: [
        { key: "profile", href: "/profile", label: "Profile", icon: <UserCircle {...iconProps} /> },
      ],
    };
  }

  return {
    operations: [
      { key: "dashboard", href: "/dashboard",                  label: "Overview",          icon: <LayoutDashboard {...iconProps} /> },
      { key: "tickets",   href: "/repair-tickets",             label: "Requests",          icon: <Ticket {...iconProps} /> },
      { key: "reports",   href: "/admin/service-desk/reports", label: "Reports",           icon: <BarChart2 {...iconProps} /> },
      { key: "devices",   href: "/admin/devices",              label: "Devices & Custody", icon: <Cpu {...iconProps} /> },
    ],
    manage: [
      { key: "users", href: "/admin/users", label: "Staff", icon: <Users {...iconProps} /> },
    ],
    account: [
      { key: "profile", href: "/profile", label: "Profile", icon: <UserCircle {...iconProps} /> },
    ],
  };
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN:            "rgba(37,99,235,0.22)",
  LEAD_TECHNICIAN:  "rgba(59,130,246,0.18)",
  TECHNICIAN:       "rgba(22,163,74,0.18)",
};

const ROLE_TEXT_COLORS: Record<string, string> = {
  ADMIN:            "#bfdbfe",
  LEAD_TECHNICIAN:  "#dbeafe",
  TECHNICIAN:       "#bbf7d0",
};

function NavSection({ label, items, active }: { label: string; items: NavItem[]; active: string }) {
  if (items.length === 0) return null;
  return (
    <div className="ops-sidebar-section">
      <p className="ops-sidebar-label">{label}</p>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`ops-nav-link ${active === item.key ? "ops-nav-link-active" : ""}`}
          aria-current={active === item.key ? "page" : undefined}
        >
          <span className="ops-nav-icon">{item.icon}</span>
          <span style={{ flex: 1 }}>{item.label}</span>
          {active === item.key && <ChevronRight size={13} strokeWidth={2} style={{ opacity: 0.4 }} />}
        </Link>
      ))}
    </div>
  );
}

export function AppShell({ active, actions, children, eyebrow, title, user }: AppShellProps) {
  const { operations, manage, account } = getNavItems(user);

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="ops-shell">
      <div className="ops-layout">
        <aside className="ops-sidebar">
          <div className="ops-brand">
            <Link href="/dashboard">
              <SimadRepairLogo className="h-8 w-auto" variant="light" />
            </Link>
            <span
              style={{
                marginLeft: "auto",
                background: ROLE_BADGE_COLORS[user.role] ?? "rgba(255,255,255,0.1)",
                color: ROLE_TEXT_COLORS[user.role] ?? "rgba(255,255,255,0.6)",
                borderRadius: "999px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "3px 8px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {ROLE_LABELS[user.role]}
            </span>
          </div>

          <nav className="ops-sidebar-nav">
            <NavSection label="Operations" items={operations} active={active} />
            <NavSection label="Manage" items={manage} active={active} />
            <NavSection label="Account" items={account} active={active} />
          </nav>

          <div className="ops-sidebar-user">
            <div className="ops-sidebar-avatar">{initials}</div>
            <div className="ops-sidebar-user-info">
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.90)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.fullName}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            <LogoutButton />
          </div>
        </aside>

        <section className="ops-main">
          <header className="ops-topbar">
            <div>
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h1
                style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, color: "var(--text-primary)", marginTop: eyebrow ? 3 : 0 }}
              >
                {title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {actions}
              <div
                style={{
                  alignItems: "center",
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  gap: 8,
                  padding: "6px 12px 6px 8px",
                }}
              >
                <span
                  style={{
                    alignItems: "center",
                    background: "var(--blue-700)",
                    borderRadius: "50%",
                    color: "#fff",
                    display: "flex",
                    fontSize: 11,
                    fontWeight: 700,
                    height: 28,
                    justifyContent: "center",
                    width: 28,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {user.fullName.split(" ")[0]}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--muted)", lineHeight: 1.3 }}>
                    {ROLE_LABELS[user.role]}
                  </span>
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
