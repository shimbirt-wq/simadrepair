const stats = [
  {
    value: "3,200 +",
    label: "Happy Students",
    icon: StudentsIcon,
    badgeClass: "bg-teal-50 text-teal-500 dark:bg-teal-500/15 dark:text-teal-300"
  },
  {
    value: "5,800 +",
    label: "Devices Fixed",
    icon: DevicesIcon,
    badgeClass: "bg-sky-50 text-sky-500 dark:bg-sky-500/15 dark:text-sky-300"
  },
  {
    value: "15,000 +",
    label: "Requests Resolved",
    icon: ToolsIcon,
    badgeClass: "bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-300"
  },
  {
    value: "98.6%",
    label: "Satisfaction Rate",
    icon: SatisfactionIcon,
    badgeClass: "bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300"
  }
] as const;

function StudentsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
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

function DevicesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M4 17h16M8 17v2h8v-2M7 5h10a2 2 0 0 1 2 2v8H5V7a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="m14.7 6.3 3 3M5.8 18.2l5.4-5.4M10.6 7.6l5.8 5.8M7.3 10.9 4.6 8.2A2 2 0 0 1 7.4 5.4l2.7 2.7M16.7 13.1l2.7 2.7a2 2 0 0 1-2.8 2.8l-2.7-2.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SatisfactionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LandingStatsStripSection() {
  return (
    <section className="-mt-8 px-4 pb-20 pt-0 transition-colors duration-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="rounded-[28px] border border-slate-200/80 bg-slate-50 px-6 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition-colors duration-300 dark:border-slate-800 dark:bg-[#020617] dark:shadow-[0_22px_50px_rgba(2,6,23,0.4)] sm:px-8 lg:h-[180px] lg:px-10 lg:py-0">
          <div className="grid gap-8 md:grid-cols-2 lg:h-full lg:grid-cols-4 lg:items-center lg:gap-0">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="relative flex items-center gap-5 lg:px-8"
                >
                  <span className={`flex h-16 w-16 flex-none items-center justify-center rounded-[20px] ${stat.badgeClass}`}>
                    <Icon />
                  </span>
                  <div>
                    <p className="text-[42px] font-extrabold leading-none tracking-[-0.05em] text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="mt-3 text-[18px] font-medium leading-none text-slate-600 dark:text-slate-300">
                      {stat.label}
                    </p>
                  </div>
                  <span className="absolute right-0 top-1/2 hidden h-[76px] w-px -translate-y-1/2 bg-slate-200 dark:bg-slate-700 lg:block last:hidden" />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
