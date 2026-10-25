"use client";

import { ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, StatusBadge, TagNumber, UrgentBadge, cn } from "@/components/ui";
import type { BoardTicket } from "@/lib/board/board-service";
import { sendJson } from "@/lib/client/api";
import { shortAge } from "@/lib/client/format";
import type { TechnicianQueue } from "@/lib/technician/queue-service";

type Tab = "mine" | "pool" | "doneToday";
const TABS: Array<{ key: Tab; label: string }> = [
  { key: "mine", label: "My tickets" },
  { key: "pool", label: "Pool" },
  { key: "doneToday", label: "Done today" },
];

function Row({ ticket }: { ticket: BoardTicket }) {
  return (
    <Link
      href={`/technician/tickets/${ticket.id}`}
      className={cn(
        "flex items-center gap-4 rounded-lg border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:shadow-focus focus-visible:outline-none",
        ticket.priority === "URGENT" && "border-l-[3px] border-l-warning",
      )}
    >
      <div className="w-16 shrink-0">{ticket.tagNumber ? <TagNumber tag={ticket.tagNumber} size="lg" /> : <span className="font-mono text-caption text-ink-muted">{ticket.trackingCode}</span>}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold text-ink">{ticket.device}</p>
        <p className="truncate text-small text-ink-secondary">{ticket.categories.join(" · ") || "—"}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={ticket.status} />
          {ticket.priority === "URGENT" ? <UrgentBadge /> : null}
          <span className="font-mono text-caption text-ink-muted">{shortAge(ticket.since)}</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" strokeWidth={1.75} />
    </Link>
  );
}

export function TechnicianWorkspace() {
  const [tab, setTab] = useState<Tab>("mine");
  const [queue, setQueue] = useState<TechnicianQueue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await sendJson<TechnicianQueue>("/api/technician/queue", "GET");
    if (result.ok) setQueue(result.data);
    else setError(result.error);
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const list = queue?.[tab] ?? [];

  return (
    <div className="mx-auto flex max-w-form flex-col gap-4">
      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn("flex h-11 items-center justify-center gap-1.5 rounded-sm text-small font-semibold transition-colors", tab === key ? "bg-surface text-ink shadow-sm" : "text-ink-secondary hover:text-ink")}
          >
            {label}
            <span className="font-mono text-caption text-ink-muted">{queue?.[key].length ?? "·"}</span>
          </button>
        ))}
      </div>

      {tab === "pool" && queue ? (
        <p className="text-small text-ink-secondary">
          You have {queue.openCount} of {queue.claimCap} open. {queue.openCount >= queue.claimCap ? "Finish one before claiming more." : "Tap a ticket to claim it."}
        </p>
      ) : null}

      {error ? <p className="text-small text-error-text">{error}</p> : null}
      {queue && list.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" strokeWidth={1.5} />}
          title={tab === "mine" ? "No tickets yet. Claim one from the pool." : tab === "pool" ? "The pool is empty." : "Nothing finished today yet."}
          action={
            tab === "mine" ? (
              <button className="text-small font-semibold text-ink-accent" onClick={() => setTab("pool")}>
                Open the pool
              </button>
            ) : undefined
          }
        />
      ) : null}
      <div className="flex flex-col gap-2.5">
        {list.map((ticket) => (
          <Row key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
