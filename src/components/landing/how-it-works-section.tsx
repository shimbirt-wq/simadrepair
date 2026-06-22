const steps = [
  {
    number: "01",
    title: "Describe the issue",
    description: "Tell us what's wrong and add details.",
    accentClass: "text-teal-500 dark:text-teal-300",
    badgeClass: "bg-teal-50 text-teal-500 dark:bg-teal-500/15 dark:text-teal-300",
    icon: DescribeIcon
  },
  {
    number: "02",
    title: "We review it",
    description: "Our team analyzes and prioritizes your request.",
    accentClass: "text-sky-500 dark:text-sky-300",
    badgeClass: "bg-sky-50 text-sky-500 dark:bg-sky-500/15 dark:text-sky-300",
    icon: ReviewIcon
  },
  {
    number: "03",
    title: "We fix it",
    description: "Our experts work on it and keep you updated.",
    accentClass: "text-violet-500 dark:text-violet-300",
    badgeClass: "bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-300",
    icon: FixIcon
  },
  {
    number: "04",
    title: "You're back to normal",
    description: "Get notified when it's resolved. That's it!",
    accentClass: "text-amber-500 dark:text-amber-300",
    badgeClass: "bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300",
    icon: CompleteIcon
  }
] as const;

function DescribeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5V9l-5-5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M14 4v5h5M8.5 12h5M8.5 16h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m16.2 16.8 2.8-2.8 1.8 1.8-2.8 2.8-2.1.4.3-2.2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H17.5A1.5 1.5 0 0 0 19 18.5V9l-5-5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M14 4v5h5M8.5 12h6M8.5 16h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="17.5" cy="16.5" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 19 1.5 1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function FixIcon() {
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

function CompleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M7 3h10l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M9 12.5 11.2 15 16 9.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowConnector() {
  return (
    <div className="hidden items-center justify-center text-sky-500 dark:text-sky-400 xl:flex">
      <svg viewBox="0 0 52 16" aria-hidden="true" className="h-4 w-10">
        <path
          d="M1 8h40M35 3l5 5-5 5"
          fill="none"
          stroke="currentColor"
          strokeDasharray="3 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </div>
  );
}

export function LandingHowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-[100px] px-4 pb-20 pt-12 transition-colors duration-300 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center">
          <p className="text-[15px] font-bold uppercase tracking-[0.18em] text-teal-500 dark:text-teal-300">
            Get Help In 4 Easy Steps
          </p>
          <h2 className="mt-3 text-[40px] font-extrabold tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[48px]">
            Simple steps, smooth solutions.
          </h2>
          <p className="mt-4 text-[18px] text-slate-600 dark:text-slate-300">Get help in 4 easy steps.</p>
        </div>

        <div className="mt-12 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-center">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.number} className="flex items-center gap-3 xl:gap-2">
                <article className="w-full rounded-[24px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-colors duration-300 dark:border-slate-800 dark:bg-[#020617] dark:shadow-[0_22px_50px_rgba(2,6,23,0.45)] xl:w-[264px]">
                  <div className="flex items-start justify-between gap-4">
                    <span className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${step.badgeClass}`}>
                      <Icon />
                    </span>
                    <span className={`text-[22px] font-bold tracking-[-0.04em] ${step.accentClass}`}>
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[18px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </article>
                {index < steps.length - 1 ? <ArrowConnector /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
