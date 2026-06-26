/* eslint-disable @next/next/no-img-element */

import { Mail } from "lucide-react";

const teamEmail = "support@simadrepair.edu.so";

const teamMembers = [
  {
    name: "Eng. Muscab Abdirashid",
    title: "Team Lead Engineer",
    image: "/images/hero/Muscab.jpeg",
    imagePosition: "center top",
    email: teamEmail,
    linkedinUrl: ""
  },
  {
    name: "Eng. Ishak Abdiaziz",
    title: "Full Stack Software Engineer",
    image: "/images/hero/Ishak%20Image%20.jpg",
    imagePosition: "center 20%",
    email: teamEmail,
    linkedinUrl: ""
  },
  {
    name: "Eng. Ruweydo Hassan",
    title: "Software Developer",
    image: "/images/hero/Ruweydo.jpeg",
    imagePosition: "center 20%",
    email: teamEmail,
    linkedinUrl: ""
  },
  {
    name: "Eng. Abdulsalam Hassan",
    title: "Backend & AI Engineer",
    image: "/images/hero/Abdisalaam%20.jpeg",
    imagePosition: "center top",
    email: teamEmail,
    linkedinUrl: ""
  }
] as const;

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7.2 20.2H3.9V9.4h3.3v10.8ZM5.6 7.9a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8ZM20.1 20.2h-3.3v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.4H9.7V9.4h3.1v1.5h.1c.4-.8 1.5-1.7 3.1-1.7 3.4 0 4 2.2 4 5v6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LandingTeamSection() {
  return (
    <section id="about-us" className="scroll-mt-[100px] border-y border-slate-200 bg-[#F8FAFC] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px]">
        <div className="max-w-[760px]">
          <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#1D4ED8]">
            Service Desk Team
          </p>
          <h2 className="mt-4 text-[34px] font-black leading-[1.05] tracking-[-0.03em] text-[#071225] sm:text-[46px]">
            Meet the team behind SIMADRepair.
          </h2>
          <p className="mt-5 max-w-[620px] text-[17px] font-medium leading-8 text-[#475569]">
            The engineers behind the repair request, tracking, dashboard, and service-desk workflow.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="group flex h-full min-h-[470px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.055)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_54px_rgba(15,23,42,0.09)]"
            >
              <div className="h-[330px] overflow-hidden bg-slate-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                  style={{ objectPosition: member.imagePosition }}
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[23px] font-black leading-7 tracking-[-0.03em] text-[#071225]">
                  {member.name}
                </h3>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#1D4ED8]">{member.title}</p>

                <div className="mt-auto flex gap-3 pt-7">
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 text-[13px] font-black text-[#071225] transition duration-200 hover:border-[#1D4ED8] hover:bg-white hover:text-[#1D4ED8]"
                    aria-label={`Email ${member.name}`}
                  >
                    <Mail className="h-4 w-4" strokeWidth={2.3} />
                    Email
                  </a>

                  {member.linkedinUrl ? (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 text-[13px] font-black text-[#071225] transition duration-200 hover:border-[#1D4ED8] hover:bg-white hover:text-[#1D4ED8]"
                      aria-label={`Open ${member.name} LinkedIn profile`}
                    >
                      <LinkedinIcon />
                      LinkedIn
                    </a>
                  ) : (
                    <span
                      className="inline-flex h-11 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 text-[13px] font-black text-slate-400"
                      aria-disabled="true"
                      title="LinkedIn profile link pending"
                    >
                      <LinkedinIcon />
                      LinkedIn
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
