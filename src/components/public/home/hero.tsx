import { MessageCircle, Search } from "lucide-react";
import Image from "next/image";
import heroPhoto from "../../../../public/images/program/volunteers-repairing.jpg";
import { ButtonLink, cn } from "@/components/ui";
import type { ActiveEvent } from "@/lib/events/event-service";
import { formatDay, formatEventDates, isEventRunning, type RegistrationState } from "@/lib/events/event-window";
import { whatsappDisplay, whatsappLink } from "@/lib/phone";
import { HeroTrack } from "./hero-track";

type Tone = "success" | "info" | "neutral";

/** What the hero says for each registration state (WA4: all from Event settings). */
function heroState(state: RegistrationState, event: ActiveEvent | null, now: Date): { badge: string | null; tone: Tone; lead: string } {
  if (!event || state === "NO_EVENT") return { badge: null, tone: "neutral", lead: "No maintenance program is scheduled right now. You can still track a repair or find your request." };
  if (state === "OPEN") return { badge: "Registration open", tone: "success", lead: "Free repair and maintenance for SIMAD students and staff. Register online, then bring your device to the desk." };
  if (state === "NOT_YET_OPEN") return { badge: `Registration opens ${formatDay(event.registrationOpensOn)}`, tone: "info", lead: "Free repair and maintenance for SIMAD students and staff. Come back when registration opens." };
  if (isEventRunning(event, now)) return { badge: "Event running · registration closed", tone: "info", lead: "Registration is closed. If you already registered, track your repair below." };
  return { badge: "Registration closed", tone: "neutral", lead: "Registration is closed. If you already registered, track your repair below." };
}

const toneClasses: Record<Tone, string> = {
  success: "bg-success-soft text-success-text",
  info: "bg-info-soft text-info-text",
  neutral: "bg-neutral-soft text-neutral-text",
};

export function Hero({ state, event, now = new Date() }: { state: RegistrationState; event: ActiveEvent | null; now?: Date }) {
  const { badge, tone, lead } = heroState(state, event, now);

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line bg-green-50">
      {/* Photo as background: a strip on phones, the right side on desktop, faded into mint. */}
      <div className="absolute inset-x-0 top-0 h-56 sm:h-72 lg:inset-y-0 lg:left-[40%] lg:h-auto">
        <Image src={heroPhoto} alt="Two student volunteers repairing laptops at a previous Computer Maintenance Program" fill priority placeholder="blur" sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover object-[50%_35%]" />
        <div className="photo-fade-hero absolute inset-0" />
      </div>
      <div className="relative mx-auto max-w-content px-4 pb-14 pt-48 sm:px-6 sm:pb-20 sm:pt-64 lg:py-24">
        <div className="flex max-w-xl flex-col items-start gap-6">
          {badge ? (
            <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-small font-semibold", toneClasses[tone])}>
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
              {badge}
            </span>
          ) : null}
          <div className="flex flex-col gap-4">
            <h1 id="hero-title" className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink sm:text-display">
              {event ? event.name : "SIMAD University IT Service Desk"}
            </h1>
            {event ? (
              <p className="font-mono text-small text-ink-secondary">
                {formatEventDates(event.startsOn, event.endsOn)} · {event.venue} · {event.hours}
              </p>
            ) : null}
            <p className="max-w-xl text-[17px] leading-relaxed text-ink-secondary">{lead}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {state === "OPEN" ? (
              <ButtonLink href="/request-repair" size="lg">
                Request repair
              </ButtonLink>
            ) : null}
            <ButtonLink href="/find" variant={state === "OPEN" ? "ghost" : "secondary"} size="lg" icon={<Search className="h-4 w-4" strokeWidth={2} />}>
              Find my request
            </ButtonLink>
          </div>
          <HeroTrack />
          {event ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-secondary">
              <MessageCircle className="h-4 w-4 text-accent" strokeWidth={1.75} aria-hidden />
              Questions? WhatsApp the desk
              <a className="font-mono font-medium text-ink-accent hover:underline" href={whatsappLink(event.deskWhatsapp, "Salaam, I have a question about the maintenance program.")} target="_blank" rel="noreferrer">
                {whatsappDisplay(event.deskWhatsapp)}
              </a>
              {state === "OPEN" ? <span className="text-ink-muted">· Registration closes {formatDay(event.registrationClosesOn)}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
