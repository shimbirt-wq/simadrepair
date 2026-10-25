import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { Card, Eyebrow, StatusBadge, TagNumber } from "@/components/ui";
import { getAuditTicket } from "@/lib/audit/audit-service";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Mogadishu" });

export default async function AuditTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const user = await requirePageRole(`/admin/audit/${ticketId}`, ["ADMIN", "LEAD_TECHNICIAN"]);
  const ticket = await getAuditTicket(prisma, ticketId);
  if (!ticket) notFound();

  return (
    <AppShell active="audit" eyebrow={ticket.event} title={ticket.trackingCode} user={user}>
      <div className="flex flex-col gap-6">
        <Link href="/admin/audit" className="flex items-center gap-1.5 self-start text-small font-medium text-ink-secondary hover:text-ink">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Search
        </Link>

        <Card className="flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
          <TagNumber tag={ticket.tagNumber} size="lg" />
          <dl className="grid flex-1 gap-x-8 gap-y-3 text-small sm:grid-cols-3">
            <div>
              <dt className="text-caption text-ink-muted">Requester</dt>
              <dd className="font-medium text-ink">
                {ticket.requester}
                {ticket.universityId ? <span className="font-mono text-ink-muted"> · {ticket.universityId}</span> : null}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-ink-muted">Device</dt>
              <dd className="font-medium text-ink">{ticket.device}</dd>
            </div>
            <div>
              <dt className="text-caption text-ink-muted">Technician</dt>
              <dd className="font-medium text-ink">{ticket.technician ?? "—"}</dd>
            </div>
          </dl>
          <StatusBadge status={ticket.status} />
        </Card>

        <Card className="p-5">
          <Eyebrow className="mb-4">Full history · {ticket.entries.length} steps</Eyebrow>
          <ol className="flex flex-col">
            {ticket.entries.map((entry) => (
              <li key={entry.id} className="grid gap-x-6 gap-y-1 border-b border-line py-3 last:border-0 sm:grid-cols-[11rem_1fr_14rem]">
                <time className="font-mono text-caption text-ink-muted sm:pt-0.5" dateTime={entry.at.toISOString()}>
                  {dateTime.format(entry.at)}
                </time>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-small font-semibold text-ink">{entry.action}</p>
                  {entry.reason ? <p className="text-small text-ink-secondary">“{entry.reason}”</p> : null}
                  {entry.details.length ? <p className="text-caption text-ink-muted">{entry.details.join(" · ")}</p> : null}
                </div>
                <p className="text-small text-ink sm:text-right">
                  {entry.actor}
                  {entry.role ? <span className="block text-caption text-ink-muted">{ROLE_LABELS[entry.role]}</span> : null}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </AppShell>
  );
}
