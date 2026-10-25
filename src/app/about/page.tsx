import type { Metadata } from "next";
import Image from "next/image";
import { PublicLayout } from "@/components/public/public-layout";
import { Card, Eyebrow } from "@/components/ui";
import { prisma } from "@/lib/db/prisma";
import { whatsappDisplay, whatsappLink } from "@/lib/phone";
import { countVolunteers, latestEvent } from "@/lib/site/volunteers";
import abdulsalam from "../../../public/images/team/abdulsalam.jpg";
import ishak from "../../../public/images/team/ishak.jpg";
import muscab from "../../../public/images/team/muscab.jpg";
import ruweydo from "../../../public/images/team/ruweydo.jpg";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About", description: "Who runs the SIMAD University IT Service Desk and the Computer Maintenance Week." };

const TEAM = [
  { name: "Eng. Muscab Abdirashid", title: "Team Lead Engineer", photo: muscab },
  { name: "Eng. Ishak Abdiaziz", title: "Full Stack Software Engineer", photo: ishak },
  { name: "Eng. Ruweydo Hassan", title: "Software Developer", photo: ruweydo },
  { name: "Eng. Abdulsalam Hassan", title: "Backend & AI Engineer", photo: abdulsalam },
];

export default async function AboutPage() {
  const event = await latestEvent(prisma);
  const volunteers = event ? await countVolunteers(prisma, event.id) : 0;

  return (
    <PublicLayout>
      <div className="flex flex-col gap-14">
        <section className="flex max-w-2xl flex-col gap-4">
          <Eyebrow>About</Eyebrow>
          <h1 className="text-h1 text-ink">SIMAD University IT Service Desk</h1>
          <p className="text-[17px] leading-relaxed text-ink-secondary">
            Every year the Computer Maintenance Week offers free repair and maintenance to SIMAD students and staff. SIMADRepair runs the week end to end: online registration, drop-off at the desk, repair by
            technicians, WhatsApp updates and pickup with a university ID card.
          </p>
          <p className="text-[17px] leading-relaxed text-ink-secondary">
            Each repair gets one tracking code, every handover of a device is recorded, and the university gets a report after every event.
          </p>
          {event && volunteers > 0 ? (
            <p className="text-body font-semibold text-ink">
              {event.name} was delivered by {volunteers} student {volunteers === 1 ? "volunteer" : "volunteers"}.
            </p>
          ) : null}
        </section>

        <section aria-labelledby="team-title" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Eyebrow>Built by</Eyebrow>
            <h2 id="team-title" className="text-h2 text-ink">
              Faculty of Computing Engineering Team
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <li key={member.name}>
                <Card className="overflow-hidden">
                  <Image src={member.photo} alt={`Portrait of ${member.name}`} placeholder="blur" sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" className="aspect-square w-full object-cover" />
                  <div className="flex flex-col gap-0.5 p-4">
                    <p className="text-body font-semibold text-ink">{member.name}</p>
                    <p className="text-small text-ink-secondary">{member.title}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {event ? (
          <Card className="flex flex-col gap-2 p-6 sm:max-w-xl">
            <p className="text-h3 text-ink">Contact the IT service desk</p>
            <p className="text-small text-ink-secondary">
              {event.venue} · {event.hours}
            </p>
            <a className="self-start font-mono text-body text-ink-accent hover:underline" href={whatsappLink(event.deskWhatsapp, "Salaam")} target="_blank" rel="noreferrer">
              WhatsApp {whatsappDisplay(event.deskWhatsapp)}
            </a>
          </Card>
        ) : null}
      </div>
    </PublicLayout>
  );
}
