import Link from "next/link";

const metrics = [
  { label: "Total Repairs", value: "320", trend: "+12%", accent: "teal" },
  { label: "Pending Repairs", value: "48", trend: "+8%", accent: "amber" },
  { label: "Completed Repairs", value: "268", trend: "+18%", accent: "teal" },
  { label: "Active Technicians", value: "24", trend: "+5%", accent: "violet" }
] as const;

const repairRows = [
  { ticket: "#R-12458", device: "Laptop - HP 250 GB", issue: "Screen flickering", status: "In Progress", priority: "Medium" },
  { ticket: "#R-12457", device: "iPhone 13", issue: "Battery not charging", status: "Pending", priority: "High" },
  { ticket: "#R-12456", device: "Dell Latitude 7420", issue: "Keyboard not working", status: "Completed", priority: "Low" },
  { ticket: "#R-12455", device: "MacBook Air M1", issue: "Wi-Fi not connecting", status: "In Progress", priority: "Medium" }
] as const;

const sidebarItems = [
  { label: "Dashboard", icon: DashboardIcon },
  { label: "Users", icon: UsersSidebarIcon },
  { label: "Devices", icon: DevicesSidebarIcon },
  { label: "Repair tickets", icon: TicketsSidebarIcon },
  { label: "Admin users", icon: AdminUsersSidebarIcon },
  { label: "API health", icon: ApiHealthSidebarIcon }
] as const;

const highlights = [
  { label: "Secure Platform", icon: ShieldIcon },
  { label: "Real-time Updates", icon: BoltIcon },
  { label: "Role Based Access", icon: UsersIcon }
] as const;

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="m9.5 11.8 1.7 1.7 3.3-3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M16.5 19.5v-1.2a3.3 3.3 0 0 0-3.3-3.3H8.8a3.3 3.3 0 0 0-3.3 3.3v1.2M11 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19.5v-1.2a3.3 3.3 0 0 0-2.4-3.2M15.8 5.2a3 3 0 0 1 0 5.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-7 w-7">
      <path
        d="M32 4 53.65 16.5v31L32 60 10.35 47.5v-31L32 4Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path d="m24.5 24.5 15 15m0-15-15 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function DateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M4 10.5 12 4l8 6.5V20H4v-9.5ZM9 20v-5h6v5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UsersSidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M16.5 19.5v-1.2a3.3 3.3 0 0 0-3.3-3.3H8.8a3.3 3.3 0 0 0-3.3 3.3v1.2M11 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19.5v-1.2a3.3 3.3 0 0 0-2.4-3.2M15.8 5.2a3 3 0 0 1 0 5.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DevicesSidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 14h2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TicketsSidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M7 4h7l5 5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5.5A1.5 1.5 0 0 1 7.5 4H7Zm7 0v5h5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AdminUsersSidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M16.5 19.5v-1.2a3.3 3.3 0 0 0-3.3-3.3H8.8a3.3 3.3 0 0 0-3.3 3.3v1.2M11 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18.5 8.5l.9 1.8 2 .3-1.45 1.42.34 2-1.79-.94-1.79.94.34-2-1.45-1.42 2-.3.9-1.8Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ApiHealthSidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="m12 21-7-4V7l7-4 7 4v10l-7 4ZM8 12h2l1-2 2 4 1-2h2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TrendIcon({ accent }: { accent: "teal" | "amber" | "violet" }) {
  const styles = {
    teal: "bg-teal-50 text-teal-500",
    amber: "bg-amber-50 text-amber-500",
    violet: "bg-violet-50 text-violet-500"
  } as const;

  return (
    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${styles[accent]}`}>
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
    </span>
  );
}

function Sparkline({ accent }: { accent: "teal" | "amber" | "violet" }) {
  const colors = {
    teal: "#14B8A6",
    amber: "#F59E0B",
    violet: "#8B5CF6"
  } as const;

  return (
    <svg viewBox="0 0 140 38" aria-hidden="true" className="block h-[38px] w-full">
      <path
        d="M3 31c10 0 13-10 22-10 10 0 12 10 22 10s13-14 22-14c10 0 13 10 22 10s13-15 22-15 13 12 22 12"
        fill="none"
        stroke={colors[accent]}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="h-[620px] w-[1200px] min-w-[1200px] max-w-none overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.10)] transition-colors duration-300 dark:border-[#1E293B] dark:bg-[#111827]">
      <div className="grid h-full grid-cols-[210px_minmax(0,1fr)]">
        <aside className="border-r border-[#E2E8F0] bg-[#F8FAFC] px-5 py-5 transition-colors duration-300 dark:border-[#1E293B] dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-200 bg-white text-[#0F766E]">
              <BrandMark />
            </span>
            <div>
              <p className="text-[14px] font-bold leading-tight text-[#0F172A] dark:text-[#F8FAFC]">FarsamoTech</p>
              <p className="mt-1 text-[11px] font-medium leading-tight text-slate-500 dark:text-[#CBD5E1]">Repair Hub</p>
            </div>
          </div>

          <nav className="mt-7 space-y-2">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;

              return (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-medium ${
                  index === 0 ? "bg-[#ECFDF5] text-[#0F766E] dark:bg-teal-950/40 dark:text-[#5EEAD4]" : "text-slate-600 dark:text-[#CBD5E1]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    index === 0 ? "bg-[#DDFBF3] text-[#0F766E] dark:bg-teal-900/60 dark:text-[#5EEAD4]" : "bg-[#F8FAFC] text-[#64748B] dark:bg-slate-800 dark:text-[#CBD5E1]"
                  }`}
                >
                  <Icon />
                </span>
                <span>{item.label}</span>
              </div>
              );
            })}
          </nav>
        </aside>

        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#0F172A] dark:text-[#F8FAFC]">Welcome back, Admin 👋</h2>
              <p className="mt-2 text-[12px] font-medium text-slate-500 dark:text-[#CBD5E1]">Here&apos;s what&apos;s happening with your system today.</p>
            </div>

            <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-[13px] font-semibold text-slate-600 transition-colors duration-300 dark:border-[#1E293B] dark:bg-[#111827] dark:text-[#CBD5E1]">
              <DateIcon />
              <span>May 17, 2026</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-[14px]">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="flex h-[170px] min-w-0 flex-col rounded-[18px] border border-slate-100 bg-white p-[18px] shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-colors duration-300 dark:border-[#1E293B] dark:bg-[#111827]"
              >
                <div className="flex items-center gap-2.5">
                  <TrendIcon accent={metric.accent} />
                  <p className="text-[12px] font-bold leading-4 text-[#475569] dark:text-[#CBD5E1]">{metric.label}</p>
                </div>
                <p className="mt-4 text-[30px] font-extrabold leading-none tracking-[-0.03em] text-[#0F172A] dark:text-[#F8FAFC]">{metric.value}</p>
                <p className="mt-3 text-[11px] font-semibold text-[#0F766E]">
                  {metric.trend} <span className="font-medium text-slate-400 dark:text-[#94A3B8]">from last 7 days</span>
                </p>
                <div className="mt-auto pt-3">
                  <Sparkline accent={metric.accent} />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_210px] gap-[14px]">
            <article className="h-[250px] rounded-[22px] border border-slate-100 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-colors duration-300 dark:border-[#1E293B] dark:bg-[#111827]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">Recent Repair Tickets</h3>
              </div>
              <div className="px-2 pb-2">
                <table className="min-w-full table-fixed text-left">
                  <thead className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-[#94A3B8]">
                    <tr>
                      <th className="px-3 py-2">Ticket ID</th>
                      <th className="px-3 py-2">Device</th>
                      <th className="px-3 py-2">Issue</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairRows.map((row) => (
                      <tr key={row.ticket} className="border-t border-slate-100 text-[11px] text-slate-600 dark:text-[#CBD5E1]">
                        <td className="px-3 py-2 font-bold text-slate-700 dark:text-[#F8FAFC]">{row.ticket}</td>
                        <td className="px-3 py-2">{row.device}</td>
                        <td className="px-3 py-2">{row.issue}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              row.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600"
                                : row.status === "Pending"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-teal-50 text-teal-600"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[10px] font-semibold ${
                              row.priority === "High"
                                ? "text-rose-500"
                                : row.priority === "Low"
                                  ? "text-emerald-500"
                                  : "text-amber-500"
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="h-[250px] w-[210px] rounded-[22px] border border-slate-100 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-colors duration-300 dark:border-[#1E293B] dark:bg-[#111827]">
              <h3 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">System Health</h3>
              <div className="mx-auto mt-8 flex h-[108px] w-[108px] items-center justify-center rounded-full border-[8px] border-teal-100 border-t-[#0F766E]">
                <div className="text-center">
                  <p className="text-[18px] font-bold leading-none text-[#0F172A] dark:text-[#F8FAFC]">98%</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-[#CBD5E1]">Healthy</p>
                </div>
              </div>
              <div className="mt-8 inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-[#CBD5E1]">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>All systems operational</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fffc_58%,#fbfefe_100%)] transition-colors duration-300 dark:bg-[#020617]">
      <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-[radial-gradient(circle_at_left_bottom,_rgba(20,184,166,0.08),_transparent_42%)]" />
      <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 justify-center px-4 pb-[110px] pt-[110px] sm:px-8 lg:grid-cols-[520px_1200px] lg:px-20 lg:items-start lg:gap-x-[180px]">
        <div className="flex w-[520px] max-w-[520px] flex-col items-start text-left">
          <div className="inline-flex h-9 items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-[18px] text-[14px] font-bold text-[#0F766E] shadow-[0_8px_20px_rgba(15,118,110,0.06)]">
            <span className="text-[#0F766E]">
              <ShieldIcon />
            </span>
            <span>Powerful. Secure. Built for Efficiency.</span>
          </div>

          <h1 className="mt-7 max-w-[640px] text-[52px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0F172A] sm:text-[64px] lg:text-[72px] dark:text-[#F8FAFC]">
            <span className="block">FarsamoTech</span>
            <span className="block text-[#0F766E]">Repair Hub</span>
          </h1>

          <p className="mt-6 max-w-[620px] text-[18px] leading-[1.7] text-[#475569] sm:text-[20px] dark:text-[#CBD5E1]">
            A modern platform for managing repairs, users, devices, and administration with security and performance at
            its core.
          </p>

          <div className="mt-8 flex flex-row flex-wrap gap-4">
            <Link
              href="/auth/register"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-[14px] bg-[#0F766E] px-[30px] text-[16px] font-bold text-white shadow-[0_14px_28px_rgba(15,118,110,0.18)] transition duration-200 hover:bg-[#115E59]"
            >
              <span>Get Started</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              </svg>
            </Link>

            <Link
              href="/devices"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-[14px] border border-[#E2E8F0] bg-white px-[30px] text-[16px] font-bold text-[#0F172A] shadow-[0_10px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-300 dark:border-[#1E293B] dark:bg-[#111827] dark:text-[#F8FAFC]"
            >
              <span>Learn More</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path
                  d="m10 7 5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-9 text-[15px] font-semibold text-[#334155] dark:text-[#CBD5E1]">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="inline-flex items-center gap-2.5 whitespace-nowrap">
                  <span className="text-[#0F766E]">
                    <Icon />
                  </span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[1200px] lg:min-w-[1200px] lg:flex-none lg:justify-end">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
