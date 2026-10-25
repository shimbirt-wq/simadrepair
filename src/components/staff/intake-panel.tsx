import { CircleAlert, KeyRound, RotateCcw } from "lucide-react";
import { Badge, Eyebrow } from "@/components/ui";
import type { IntakeDetail } from "@/lib/tickets/intake-detail";

/** What the requester reported: device, diagnosis answers, photos. Staff only. */
export function IntakePanel({ intake }: { intake: IntakeDetail }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <Eyebrow>Device</Eyebrow>
        <p className="text-h3 text-ink">
          {intake.device.name} <span className="text-small font-normal text-ink-muted">· {intake.device.type}</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {intake.device.specs.map((spec) => (
            <Badge key={spec}>{spec}</Badge>
          ))}
          {intake.device.age ? <Badge>{intake.device.age}</Badge> : null}
          {intake.device.serialNumber ? <Badge className="font-mono">S/N {intake.device.serialNumber}</Badge> : null}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Eyebrow>Problem</Eyebrow>
        {intake.categories.length ? (
          <div className="flex flex-wrap gap-1.5">
            {intake.categories.map((category) => (
              <Badge key={category} tone="accent">
                {category}
              </Badge>
            ))}
          </div>
        ) : null}
        <p className="text-body text-ink">{intake.description}</p>
        {intake.answers.length ? (
          <dl className="flex flex-col gap-1 rounded-md bg-muted px-4 py-3 text-small">
            {intake.answers.map((line) => (
              <div key={`${line.category}-${line.question}`} className="flex flex-wrap justify-between gap-x-4">
                <dt className="text-ink-secondary">{line.question}</dt>
                <dd className="font-medium text-ink">{line.answer}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <p className="text-small text-ink-secondary">
          {intake.startedWhen ? <>Started: {intake.startedWhen}. </> : null}
          {intake.recentEvents.length ? <>Before it started: {intake.recentEvents.join(", ")}.</> : null}
        </p>
        {intake.errorMessage ? (
          <p className="flex items-start gap-2 rounded-md border border-line px-3 py-2 font-mono text-caption text-ink">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={2} />
            {intake.errorMessage}
          </p>
        ) : null}
      </section>

      <section className="flex flex-wrap gap-1.5">
        {intake.wipeAllowed ? (
          <Badge tone="success" icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />}>
            Reinstall allowed
          </Badge>
        ) : (
          <Badge tone="warning" icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />}>
            Ask before reinstalling
          </Badge>
        )}
        {intake.needsPassword ? (
          <Badge tone="info" icon={<KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />}>
            Password needed
          </Badge>
        ) : null}
        {intake.accessories.length ? <Badge>Left: {intake.accessories.join(", ")}</Badge> : <Badge>Device only</Badge>}
      </section>

      {intake.photos.length ? (
        <section className="flex flex-col gap-2">
          <Eyebrow>Photos</Eyebrow>
          <div className="grid grid-cols-3 gap-2">
            {intake.photos.map((photo, index) => (
              <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border border-line bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked route */}
                <img src={photo.url} alt={`${photo.kind === "DAMAGE" ? "Damage" : "Requester"} photo ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
