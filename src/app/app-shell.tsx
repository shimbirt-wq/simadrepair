import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart2, CalendarDays, History, LayoutDashboard, Menu, Shield, UserCircle, Users, Wrench } from "lucide-react";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { Eyebrow, ToastProvider, cn } from "@/components/ui";
import type { PublicUser } from "@/lib/auth/public-user";
import { ROLE_LABELS, isInternalUserRole } from "@/lib/auth/roles";
import { LogoutButton } from "@/app/logout-button";

export type AppShellSection =
  | "dashboard"
  | "lead"
  | "technician"
  | "tickets"
  | "devices"
  | "reports"
  | "users"
  | "events"
  | "audit"
  | "profile";

type AppShellProps = {
  active: AppShellSection;
  actions?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
  user: PublicUser;
  /** Wide pages (board, tables) use the full 1440px; others stay at 1200px. */
  width?: "content" | "wide";
};

type NavItem = { key: AppShellSection; href: string; label: string; icon: ReactNode };
type NavGroup = { label: string; items: NavItem[] };

const icon = { className: "h-[18px] w-[18px]", strokeWidth: 1.75 };

function getNavGroups(user: PublicUser): NavGroup[] {
  if (!isInternalUserRole(user.role)) return [];

  if (user.role === "TECHNICIAN") {
    return [
      {
        label: "Work",
        items: [
          { key: "technician", href: "/technician/workspace", label: "My tickets", icon: <Wrench {...icon} /> },
        ],
      },
    ];
  }

  if (user.role === "LEAD_TECHNICIAN") {
    return [
      {
        label: "Desk",
        items: [
          { key: "lead", href: "/lead", label: "Board", icon: <Shield {...icon} /> },
          { key: "technician", href: "/technician/workspace", label: "My repairs", icon: <Wrench {...icon} /> },
          { key: "dashboard", href: "/dashboard", label: "Overview", icon: <LayoutDashboard {...icon} /> },
          { key: "reports", href: "/reports", label: "Reports", icon: <BarChart2 {...icon} /> },
          { key: "audit", href: "/admin/audit", label: "Audit", icon: <History {...icon} /> },
        ],
      },
    ];
  }

  return [
    {
      label: "Event",
      items: [
        { key: "dashboard", href: "/dashboard", label: "Overview", icon: <LayoutDashboard {...icon} /> },
        { key: "lead", href: "/lead", label: "Board", icon: <Shield {...icon} /> },
        { key: "reports", href: "/reports", label: "Reports", icon: <BarChart2 {...icon} /> },
      ],
    },
    {
      label: "Manage",
      items: [
        { key: "events", href: "/admin/events", label: "Events", icon: <CalendarDays {...icon} /> },
        { key: "users", href: "/admin/users", label: "Staff", icon: <Users {...icon} /> },
        { key: "audit", href: "/admin/audit", label: "Audit", icon: <History {...icon} /> },
      ],
    },
  ];
}

function NavLinks({ groups, active }: { groups: NavGroup[]; active: AppShellSection }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 pt-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">{group.label}</p>
          {group.items.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-sm px-3 text-small font-medium transition-colors duration-fast",
                  isActive ? "bg-green-400/20 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className={isActive ? "text-green-300" : "text-white/55"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function UserFooter({ user }: { user: PublicUser }) {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-caption font-semibold text-white">{initialsOf(user.fullName)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold text-white">{user.fullName}</span>
        <span className="block text-caption text-white/50">{ROLE_LABELS[user.role]}</span>
      </span>
      <LogoutButton />
    </div>
  );
}

export function AppShell({ active, actions, children, eyebrow, title, user, width = "content" }: AppShellProps) {
  const groups = getNavGroups(user);
  const profileActive = active === "profile";

  return (
    <ToastProvider>
      <div className="min-h-screen bg-app lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col bg-inverse lg:flex">
          <Link href="/dashboard" className="flex h-[60px] items-center px-5">
            <SimadRepairLogo className="h-8 w-auto" variant="light" />
          </Link>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="Main">
            <NavLinks groups={groups} active={active} />
            <div className="mt-auto pb-2 pt-4">
              <Link
                href="/profile"
                aria-current={profileActive ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-sm px-3 text-small font-medium",
                  profileActive ? "bg-green-400/20 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <UserCircle {...icon} className="h-[18px] w-[18px] text-white/55" />
                Profile
              </Link>
            </div>
          </nav>
          <UserFooter user={user} />
        </aside>

        <div className="flex min-w-0 flex-col">
          <details className="group border-b border-white/10 bg-inverse lg:hidden">
            <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
              <SimadRepairLogo className="h-7 w-auto" variant="light" />
              <Menu className="h-6 w-6 text-white" strokeWidth={1.75} aria-label="Menu" />
            </summary>
            <nav className="flex flex-col gap-1 px-3 pb-3" aria-label="Main">
              <NavLinks groups={groups} active={active} />
              <Link href="/profile" className="flex h-10 items-center gap-3 rounded-sm px-3 text-small font-medium text-white/70">
                <UserCircle {...icon} className="h-[18px] w-[18px] text-white/55" />
                Profile
              </Link>
            </nav>
            <UserFooter user={user} />
          </details>

          <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
            <div className={cn("mx-auto flex min-h-[60px] items-center justify-between gap-4 px-4 py-2 sm:px-7", width === "wide" ? "max-w-ops" : "max-w-content")}>
              <div className="min-w-0">
                {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
                <h1 className="truncate text-[18px] font-bold leading-tight text-ink">{title}</h1>
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
          </header>

          <main className={cn("mx-auto w-full flex-1 px-4 py-6 sm:px-7", width === "wide" ? "max-w-ops" : "max-w-content")}>{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
