/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

const teamMembers = [
  {
    name: "Engineer Ruweydo",
    role: "Software developer",
    image: "/images/hero/Ruweydo.jpeg",
    imagePosition: "center 20%",
    accent: "bg-[#8B5CF6]",
    glow: "bg-[rgba(139,92,246,0.16)]"
  },
  {
    name: "Engineer Ishak",
    role: "Full-stack software engineer",
    image: "/images/hero/Ishak%20Image%20.jpg",
    imagePosition: "center 20%",
    accent: "bg-[#14B8A6]",
    glow: "bg-[rgba(20,184,166,0.16)]"
  },
  {
    name: "Engineer Muscab",
    role: "UI/UX Designer",
    image: "/images/hero/Muscab.jpeg",
    imagePosition: "center top",
    accent: "bg-[#475569]",
    glow: "bg-[rgba(71,85,105,0.14)]"
  },
  {
    name: "Engineer Abdirahman",
    role: "Full-stack software engineer",
    image: "/images/hero/Abdisalaam%20.jpeg",
    imagePosition: "center top",
    accent: "bg-[rgb(180,140,70)]",
    glow: "bg-[rgba(180,140,70,0.16)]"
  }
] as const;

const benefits = [
  {
    title: "Lightning Fast",
    description: "Quick response and faster resolutions for all requests.",
    icon: BoltIcon,
    iconClass: "bg-teal-50 text-teal-500 dark:bg-teal-500/15 dark:text-teal-300"
  },
  {
    title: "Secure & Private",
    description: "Enterprise-grade security and privacy.",
    icon: ShieldIcon,
    iconClass: "bg-sky-50 text-sky-500 dark:bg-sky-500/15 dark:text-sky-300"
  },
  {
    title: "Expert Support",
    description: "Skilled IT professionals ready to help.",
    icon: SupportIcon,
    iconClass: "bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-300"
  }
] as const;

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
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

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M8 10a4 4 0 1 1 8 0v1a2 2 0 0 0 1 1.73l.4.23A1.8 1.8 0 0 1 18.3 16H15a3 3 0 0 1-3 3H9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5.7 16a1.8 1.8 0 0 1 .9-3.04l.4-.23A2 2 0 0 0 8 11v-1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LandingHero() {
  return (
    <section
      id="home"
      className="scroll-mt-[100px] overflow-hidden bg-white px-4 pb-8 pt-36 transition-colors duration-300 sm:px-6 sm:pt-40 lg:px-8 lg:pt-48 dark:bg-[#020617]"
    >
      <div className="mx-auto min-h-[720px] max-w-[1400px]">
        <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
          <span className="inline-flex h-11 items-center gap-2 rounded-full border border-teal-100 bg-[#F0FDFA] px-5 text-sm font-semibold text-[#0F766E] shadow-[0_10px_30px_rgba(20,184,166,0.08)] dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-[#5EEAD4]">
            <BadgeIcon />
            Smarter Repairs. Better Experience.
          </span>

          <h1 className="mt-7 text-[42px] font-extrabold leading-[1.08] tracking-[-0.05em] text-[#0F172A] dark:text-[#F8FAFC] sm:text-[54px] lg:text-[64px]">
            Reliable IT support,
            <span className="block">
              right <span className="text-[#0F766E]">when you need it.</span>
            </span>
          </h1>

          <p className="mt-6 max-w-[620px] text-[20px] leading-[1.7] text-[#475569] dark:text-[#CBD5E1]">
            Report issues, get expert help, and track progress all in one place.
          </p>

          <div id="requests" className="scroll-mt-[100px] mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/repair-tickets/create"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#0F766E] px-7 text-[16px] font-semibold text-white shadow-[0_18px_45px_rgba(15,118,110,0.24)] transition duration-200 hover:bg-[#115E59]"
            >
              <PlusIcon />
              Submit a Request
            </Link>
            <Link
              href="/repair-tickets"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-teal-200 bg-white px-7 text-[16px] font-semibold text-[#0F766E] transition duration-200 hover:border-teal-300 hover:bg-[#F8FFFD] dark:border-teal-900/60 dark:bg-transparent dark:text-[#5EEAD4] dark:hover:bg-teal-950/30"
            >
              <SearchIcon />
              Track Your Request
            </Link>
          </div>
        </div>

        <div
          id="about-us"
          className="mx-auto mb-7 mt-[96px] flex max-w-[760px] scroll-mt-[100px] flex-col items-center text-center"
        >
          <h2 className="text-[28px] font-extrabold leading-[1.25] text-[#0F172A] dark:text-[#F8FAFC]">
            Meet the <span className="text-[#0F766E]">dedicated team</span> behind your smooth IT support
            experience.
          </h2>
          <p className="mt-3 max-w-[640px] text-[16px] leading-[1.6] text-[#64748B] dark:text-[#CBD5E1]">
            Four skilled minds working together to keep your devices, requests, and support journey moving
            smoothly.
          </p>
        </div>

        <div className="relative mt-12 flex justify-center">
          <div className="pointer-events-none absolute inset-x-[14%] top-4 h-[320px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(20,184,166,0.08),_rgba(255,255,255,0)_72%)]" />
          <div className="relative flex w-full max-w-[1440px] flex-col items-center gap-8 px-4 sm:grid sm:grid-cols-2 sm:justify-items-center sm:gap-x-8 sm:gap-y-10 lg:flex lg:flex-row lg:items-end lg:justify-center lg:gap-6 lg:px-0">
            {teamMembers.map((member, index) => {
              const cardLayout = [
                "sm:rotate-[-2deg] sm:translate-y-2 lg:rotate-[-4deg] lg:translate-y-[18px]",
                "sm:rotate-[-1deg] lg:rotate-[-1deg] lg:translate-y-0",
                "sm:rotate-[1deg] lg:rotate-[1deg] lg:translate-y-0",
                "sm:rotate-[2deg] sm:translate-y-2 lg:rotate-[4deg] lg:translate-y-[18px]"
              ];

              return (
                <article
                  key={member.name}
                  className={`group w-full max-w-[380px] transition duration-300 hover:-translate-y-2 hover:rotate-0 sm:w-[380px] lg:w-[380px] lg:flex-none ${cardLayout[index]}`}
                >
                  <div className={`rounded-[22px] p-[8px] ${member.glow}`}>
                    <div className="h-[380px] w-[380px] overflow-hidden rounded-[28px] shadow-[0_20px_50px_rgba(15,23,42,0.10)] transition duration-300 group-hover:shadow-[0_26px_64px_rgba(15,23,42,0.14)]">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: member.imagePosition }}
                      />
                    </div>
                  </div>
                  <div className="px-2 pt-4 sm:px-1 lg:px-2">
                    <div className="flex items-start gap-3">
                      <span className={`mt-[9px] h-3 w-3 flex-none rounded-full ${member.accent}`} />
                      <div>
                        <h3 className="text-[24px] font-bold leading-none tracking-[-0.03em] text-[#0F172A] dark:text-[#F8FAFC]">
                          {member.name}
                        </h3>
                        <p className="mt-2 text-[15px] font-medium leading-none text-[#64748B] dark:text-[#CBD5E1]">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-[1180px] rounded-[30px] bg-white px-6 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:bg-[#020617] sm:px-8 lg:px-10">
          <div className="grid gap-8 md:grid-cols-3 md:gap-0">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                key={benefit.title}
                className="relative flex items-start gap-4 px-2 py-2 md:px-6 lg:px-8"
              >
                <span
                  className={`flex h-16 w-16 flex-none items-center justify-center rounded-[20px] ${benefit.iconClass}`}
                >
                  <Icon />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[24px] font-bold tracking-[-0.03em] text-[#0F172A] dark:text-[#F8FAFC]">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-[16px] leading-8 text-[#64748B] dark:text-[#CBD5E1]">
                    {benefit.description}
                  </p>
                </div>
                <span className="absolute right-0 top-1/2 hidden h-[72px] w-px -translate-y-1/2 bg-[#EAEFF3] md:block last:hidden dark:bg-[#1E293B]" />
              </article>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
