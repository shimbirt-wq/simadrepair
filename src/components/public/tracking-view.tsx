"use client";

import { Check, MapPin, MessageCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, buttonClasses, Card, Eyebrow, Input, StatusBadge, cn } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import { whatsappDisplay, whatsappLink } from "@/lib/phone";
import type { PublicTrackingInfo } from "@/lib/service-desk/public-tracking";

type Info = Omit<PublicTrackingInfo, "submittedAt" | "timeline"> & { submittedAt: string; timeline: Array<{ label: string; at: string }> };

const STEPS = [
  { label: "Submitted", statuses: ["SUBMITTED"] },
  { label: "Received", statuses: ["RECEIVED"] },
  { label: "In repair", statuses: ["IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED"] },
  { label: "Ready", statuses: ["READY_FOR_PICKUP", "CANNOT_BE_REPAIRED"] },
  { label: "Collected", statuses: ["COLLECTED"] },
] as const;

function headline(info: Info): { title: string; body: string } {
  const venue = info.event ? `${info.event.venue}, ${info.event.hours}` : "the IT service desk";
  switch (info.status) {
    case "SUBMITTED":
      return { title: "Bring your device to the desk", body: `Drop it off at ${venue}. Bring your university ID card and charger.` };
    case "RECEIVED":
      return { title: "Your device is at the desk", body: "A technician will start soon." };
    case "IN_REPAIR":
      return { title: "Your device is being repaired", body: "We'll message you on WhatsApp when it's ready." };
    case "WAITING_FOR_PARTS":
      return { title: "Waiting for a part", body: "Buy this part and bring it to the desk:" };
    case "ACTION_NEEDED":
      return { title: "We need something from you", body: "Please do this so we can continue:" };
    case "READY_FOR_PICKUP":
      return { title: "Ready for pickup", body: `Collect it at ${venue}. Bring your university ID card.` };
    case "CANNOT_BE_REPAIRED":
      return { title: "We couldn't repair this device", body: "Reason:" };
    case "COLLECTED":
      return { title: "Collected", body: "Thank you for using the SIMAD IT Service Desk." };
    case "CANCELLED":
      return { title: "Request cancelled", body: "This request was cancelled before drop-off." };
    default:
      return { title: "In progress", body: "" };
  }
}

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Mogadishu" });

function Progress({ status }: { status: string }) {
  const current = STEPS.findIndex((step) => (step.statuses as readonly string[]).includes(status));
  if (current < 0) return null;
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Progress">
      {STEPS.map((step, index) => (
        <li key={step.label} className="flex flex-col gap-2">
          <span className={cn("h-1.5 rounded-full", index <= current ? "bg-accent" : "bg-n-150")} />
          <span className={cn("text-caption", index === current ? "font-semibold text-ink" : "text-ink-muted")}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

function Result({ info }: { info: Info }) {
  const { title, body } = headline(info);
  const message = `Salaam, I'm ${info.requesterFirstName}. My repair code is ${info.trackingCode}.`;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-6 p-6 sm:p-8" focal={info.status === "READY_FOR_PICKUP" || info.status === "ACTION_NEEDED"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-small font-semibold tracking-wide text-ink">{info.trackingCode}</span>
          <StatusBadge status={info.status} audience="public" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-h2 text-ink">{title}</h2>
          {body ? <p className="text-body text-ink-secondary">{body}</p> : null}
          {info.detail ? <p className="rounded-md bg-warning-soft px-4 py-3 text-body font-medium text-warning-text">{info.detail}</p> : null}
        </div>
        <Progress status={info.status} />
        <dl className="grid gap-4 border-t border-line pt-5 text-small sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Device</dt>
            <dd className="font-medium text-ink">
              {info.device.brand} {info.device.model} · {info.device.deviceType}
            </dd>
          </div>
          {info.event ? (
            <div>
              <dt className="text-ink-muted">Desk</dt>
              <dd className="flex items-center gap-1.5 font-medium text-ink">
                <MapPin className="h-4 w-4 text-ink-muted" strokeWidth={1.75} aria-hidden />
                {info.event.venue} · {info.event.hours}
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {info.contact ? (
        <Card className="flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold text-ink">{info.contact.kind === "technician" ? `${info.contact.name}, your technician` : "IT service desk"}</p>
            <p className="font-mono text-caption text-ink-muted">{whatsappDisplay(info.contact.whatsapp)}</p>
          </div>
          <a className={buttonClasses("secondary", "md")} href={whatsappLink(info.contact.whatsapp, message)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </Card>
      ) : null}

      {info.timeline.length > 0 ? (
        <Card className="p-6">
          <Eyebrow className="mb-4">History</Eyebrow>
          <ol className="flex flex-col gap-3">
            {[...info.timeline].reverse().map((item, index) => (
              <li key={`${item.label}-${item.at}`} className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", index === 0 ? "bg-accent text-white" : "bg-n-100 text-ink-muted")}>
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="flex-1 text-small text-ink">{item.label}</span>
                <span className="font-mono text-caption text-ink-muted">{dateTime.format(new Date(item.at))}</span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </div>
  );
}

export function TrackingView({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode ?? "");
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function lookup(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter your tracking code.");
      return;
    }
    startTransition(async () => {
      const result = await sendJson<Info>(`/api/public/tracking/${encodeURIComponent(trimmed)}`, "GET");
      if (!result.ok) {
        setInfo(null);
        setError(result.error);
        return;
      }
      setError(null);
      setInfo(result.data);
      setCode(result.data.trackingCode);
      router.replace(`/track?code=${encodeURIComponent(result.data.trackingCode)}`, { scroll: false });
    });
  }

  useEffect(() => {
    if (initialCode) lookup(initialCode);
    // Look up once for a code in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          lookup(code);
        }}
      >
        <label htmlFor="tracking-code" className="text-small font-semibold text-ink">
          Tracking code
        </label>
        <div className="flex gap-2">
          <Input
            id="tracking-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="SIM-26-K7P3QX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase tracking-wide"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "tracking-error" : undefined}
          />
          <Button type="submit" loading={pending} icon={<Search className="h-4 w-4" strokeWidth={2} />}>
            Track
          </Button>
        </div>
        {error ? (
          <p id="tracking-error" className="text-caption text-error-text" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {info ? <Result info={info} /> : null}
    </div>
  );
}
