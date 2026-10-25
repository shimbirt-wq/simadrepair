import { CalendarDays, Clock, MapPin, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { ButtonLink, Card, cn } from "@/components/ui";
import type { ActiveEvent } from "@/lib/events/event-service";
import { formatDay, formatEventDates, isEventRunning, type RegistrationState } from "@/lib/events/event-window";
import { whatsappDisplay, whatsappLink } from "@/lib/phone";
import { HeroTrack } from "./hero-track";

type Tone = "success" | "info" | "neutral";

/** What the hero says for each registration state (WA4: all from Event settings). */
function heroState(state: RegistrationState, event: ActiveEvent | null, now: Date): { badge: string | null; tone: Tone; lead: string } {
  if (!event || state === "NO_EVENT") return { badge: null, tone: "neutral", lead: "No Maintenance Week is scheduled right now. You can still track a repair or find your request." };
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
    <section aria-labelledby="hero-title" className="border-b border-line bg-surface">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[7fr_5fr] lg:items-center">
        <div className="flex flex-col items-start gap-6">
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
        </div>

        {event ? (
          <Card className="flex flex-col gap-5 p-6 sm:p-7">
            <p className="text-small font-semibold text-ink">Where to bring your device</p>
            <dl className="flex flex-col gap-4 text-small">
              <Detail icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />} label="Dates" value={formatEventDates(event.startsOn, event.endsOn)} />
              <Detail icon={<MapPin className="h-5 w-5" strokeWidth={1.75} />} label="Desk" value={event.venue} />
              <Detail icon={<Clock className="h-5 w-5" strokeWidth={1.75} />} label="Hours" value={event.hours} />
              <Detail
                icon={<MessageCircle className="h-5 w-5" strokeWidth={1.75} />}
                label="Desk WhatsApp"
                value={
                  <a className="font-mono text-ink-accent hover:underline" href={whatsappLink(event.deskWhatsapp, "Salaam, I have a question about the Maintenance Week.")} target="_blank" rel="noreferrer">
                    {whatsappDisplay(event.deskWhatsapp)}
                  </a>
                }
              />
            </dl>
            {state === "OPEN" ? (
              <p className="border-t border-line pt-4 text-caption text-ink-muted">Registration closes {formatDay(event.registrationClosesOn)}.</p>
            ) : null}
          </Card>
        ) : (
          <Card className="flex flex-col gap-3 p-6">
            <p className="text-small font-semibold text-ink">Lost your tracking code?</p>
            <p className="text-small text-ink-secondary">Find your request with your university ID and the last 4 digits of your phone.</p>
            <Link href="/find" className="text-small font-semibold text-ink-accent hover:underline">
              Find my request
            </Link>
          </Card>
        )}
      </div>
    </section>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-accent" aria-hidden>
        {icon}
      </span>
      <div>
        <dt className="text-caption text-ink-muted">{label}</dt>
        <dd className="font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}
