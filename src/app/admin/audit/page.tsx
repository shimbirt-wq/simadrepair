import { History, Search } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { Button, Card, EmptyState, Input, StatusBadge, TagNumber } from "@/components/ui";
import { searchTickets } from "@/lib/audit/audit-service";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { prisma } from "@/lib/db/prisma";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Mogadishu" });

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = await requirePageRole("/admin/audit", ["ADMIN", "LEAD_TECHNICIAN"]);
  const q = ([(await searchParams).q].flat()[0] ?? "").slice(0, 60);
  const results = q ? await searchTickets(prisma, q) : [];

  return (
    <AppShell active="audit" eyebrow="Audit" title="Find a ticket" user={user}>
      <div className="flex flex-col gap-6">
        <form className="flex max-w-xl gap-2" role="search">
          <label htmlFor="audit-q" className="sr-only">
            Tracking code, tag or university ID
          </label>
          <Input id="audit-q" name="q" defaultValue={q} placeholder="SIM-26-K7P3QX, #147 or CS383833" autoComplete="off" spellCheck={false} className="font-mono" autoFocus />
          <Button type="submit" icon={<Search className="h-4 w-4" strokeWidth={2} />}>
            Search
          </Button>
        </form>

        {!q ? (
          <EmptyState icon={<History className="h-8 w-8" strokeWidth={1.5} />} title="Search any event by tracking code, tag number or university ID." />
        ) : results.length === 0 ? (
          <EmptyState icon={<Search className="h-8 w-8" strokeWidth={1.5} />} title={`No ticket matches "${q}".`} />
        ) : (
          <Card className="divide-y divide-line">
            {results.map((ticket) => (
              <Link key={ticket.id} href={`/admin/audit/${ticket.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-n-50">
                <TagNumber tag={ticket.tagNumber} size="sm" className="w-12" />
                <span className="font-mono text-small font-semibold text-ink">{ticket.trackingCode}</span>
                <span className="min-w-0 flex-1 truncate text-small text-ink">
                  {ticket.requester}
                  {ticket.universityId ? <span className="font-mono text-ink-muted"> · {ticket.universityId}</span> : null}
                  <span className="text-ink-muted"> · {ticket.device}</span>
                </span>
                <span className="text-caption text-ink-muted">
                  {ticket.event} · {day.format(ticket.createdAt)}
                </span>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
