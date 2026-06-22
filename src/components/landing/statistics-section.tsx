const statistics = [
  {
    value: "2,500+",
    label: "Active Users",
    accent: "teal",
    icon: UsersIcon
  },
  {
    value: "4,800+",
    label: "Devices Managed",
    accent: "blue",
    icon: DeviceIcon
  },
  {
    value: "12,600+",
    label: "Repairs Completed",
    accent: "orange",
    icon: RepairIcon
  },
  {
    value: "99.9%",
    label: "System Uptime",
    accent: "violet",
    icon: ShieldIcon
  }
] as const;

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
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

function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
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

function RepairIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="m14.5 6.5 3-3 3 3-3 3M13 8l-9 9v3h3l9-9M10 5l2 2M5 10l2 2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
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

export function LandingStatisticsSection() {
  const accentClasses = {
    teal: "bg-teal-100/80 text-[#0F766E]",
    blue: "bg-sky-100/80 text-sky-600",
    orange: "bg-orange-100/80 text-orange-500",
    violet: "bg-violet-100/80 text-violet-600"
  } as const;

  return (
    <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-[linear-gradient(90deg,#ECFDF5_0%,#F0FDFA_50%,#ECFEFF_100%)] py-14 transition-colors duration-300 dark:bg-[#020617]">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-16">
        <div className="mt-0 rounded-[24px] bg-white/45 px-6 py-14 backdrop-blur-[1px] sm:px-10 dark:bg-[#111827]">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {statistics.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label} className="flex items-center gap-5">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] ${accentClasses[stat.accent]}`}
                  >
                    <Icon />
                  </div>
                  <div>
                    <p className="text-[36px] font-extrabold leading-none tracking-[-0.03em] text-[#0F172A] dark:text-[#F8FAFC]">{stat.value}</p>
                    <p className="mt-2 text-[16px] font-medium text-[#64748B] dark:text-[#CBD5E1]">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
