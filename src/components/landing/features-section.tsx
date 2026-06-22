const featureCards = [
  {
    title: "User Management",
    description: "Add, manage and control user access with different roles.",
    accent: "teal",
    icon: UsersIcon
  },
  {
    title: "Device Tracking",
    description: "Keep track of all devices and their repair history.",
    accent: "blue",
    icon: DeviceIcon
  },
  {
    title: "Repair Tickets",
    description: "Create, assign and track repair tickets in real-time.",
    accent: "orange",
    icon: TicketIcon
  },
  {
    title: "Admin Controls",
    description: "Powerful admin tools for system configuration and oversight.",
    accent: "violet",
    icon: ShieldIcon
  },
  {
    title: "API & Integrations",
    description: "Seamless API integration and health monitoring.",
    accent: "mint",
    icon: CodeIcon
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

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6H18a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H5.5A1.5 1.5 0 0 1 4 17.5v-10Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M9 9h6M9 13h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="m9 8-4 4 4 4M15 8l4 4-4 4M13 5l-2 14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LandingFeaturesSection() {
  const accentClasses = {
    teal: "bg-teal-50 text-[#0F766E]",
    blue: "bg-sky-50 text-sky-600",
    orange: "bg-orange-50 text-orange-500",
    violet: "bg-violet-50 text-violet-600",
    mint: "bg-emerald-50 text-emerald-600"
  } as const;

  return (
    <section className="bg-white transition-colors duration-300 dark:bg-[#020617]">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-14 sm:px-8">
        <div className="mx-auto max-w-[920px] text-center">
          <h2 className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0F172A] sm:text-[40px] dark:text-[#F8FAFC]">
            Everything you need to manage repairs efficiently
          </h2>
          <p className="mx-auto mt-4 max-w-[720px] text-[18px] leading-[1.7] text-[#64748B] dark:text-[#CBD5E1]">
            Built with modern technology to help teams work smarter and deliver better service.
          </p>
        </div>

        <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {featureCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="group flex h-[220px] flex-col rounded-[20px] border border-[#E2E8F0] bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.10)] dark:border-[#1E293B] dark:bg-[#111827]"
                style={{
                  animationDelay: `${index * 40}ms`
                }}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${accentClasses[card.accent]}`}
                >
                  <Icon />
                </div>
                <h3 className="mt-6 text-[22px] font-bold leading-[1.25] tracking-[-0.02em] text-[#0F172A] dark:text-[#F8FAFC]">{card.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[#64748B] dark:text-[#CBD5E1]">{card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
