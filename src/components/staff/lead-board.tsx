"use client";

import { CalendarCheck, Clock, HandHelping, RefreshCw, Search, UserPlus } from "lucide-react";
import { EndOfEventPanel } from "@/components/staff/end-of-event";
import { PickupSearch } from "@/components/staff/pickup-search";
import { RequestForm } from "@/components/public/request-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeskActions, UndoControl } from "@/components/staff/ticket-actions";
import { TicketSheet } from "@/components/staff/ticket-sheet";
import { BoardColumn, Button, Card, Dialog, EmptyState, Input, TagNumber, UrgentBadge, cn } from "@/components/ui";
import { BOARD_COLUMNS, type BoardColumnKey } from "@/lib/board/board-rules";
import type { Board, BoardTicket } from "@/lib/board/board-service";
import { sendJson } from "@/lib/client/api";
import { shortAge } from "@/lib/client/format";

const REFRESH_MS = 30_000;

function matches(ticket: BoardTicket, query: string) {
  if (!query) return true;
  const q = query.toLowerCase().replace(/^#/, "");
  return [ticket.trackingCode, ticket.tagNumber?.toString().padStart(3, "0"), ticket.universityId, ticket.requesterName, ticket.phone]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

function TicketCard({ ticket, onOpen, now }: { ticket: BoardTicket; onOpen: () => void; now: number }) {
  return (
    <button type="button" onClick={onOpen} className="text-left focus-visible:outline-none">
      <Card
        interactive
        className={cn(
          "flex flex-col gap-2 p-3.5 focus-within:shadow-focus",
          ticket.stuck && "border-warning/60 bg-warning-soft/40",
          ticket.priority === "URGENT" && !ticket.stuck && "border-l-[3px] border-l-warning",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          {ticket.tagNumber ? <TagNumber tag={ticket.tagNumber} size="md" /> : <span className="font-mono text-small font-semibold text-ink-secondary">{ticket.trackingCode}</span>}
          <span className={cn("flex items-center gap-1 font-mono text-caption", ticket.stuck ? "font-semibold text-warning-text" : "text-ink-muted")}>
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {shortAge(ticket.since, now)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-small font-semibold text-ink">{ticket.device}</p>
          <p className="truncate text-caption text-ink-secondary">{ticket.requesterName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {ticket.priority === "URGENT" ? <UrgentBadge /> : null}
          {ticket.categories.slice(0, 2).map((category) => (
            <span key={category} className="rounded-full bg-muted px-2 py-0.5 text-caption text-ink-secondary">
              {category}
            </span>
          ))}
        </div>
        {ticket.technician || ticket.zone || ticket.atItOffice ? (
          <p className="flex justify-between text-caption text-ink-muted">
            <span className="truncate">{ticket.technician?.name ?? ""}</span>
            {ticket.atItOffice ? <span className="font-semibold text-ink-secondary">IT office</span> : ticket.zone ? <span className="font-mono">Zone {ticket.zone}</span> : null}
          </p>
        ) : null}
        {ticket.stuck ? <p className="text-caption font-semibold text-warning-text">Stuck — check on it</p> : null}
      </Card>
    </button>
  );
}

export function LeadBoard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [walkIn, setWalkIn] = useState(false);
  const [pickup, setPickup] = useState(false);
  const [ending, setEnding] = useState(false);

  const load = useCallback(async () => {
    const result = await sendJson<Board>("/api/lead/board", "GET");
    if (result.ok) {
      setBoard(result.data);
      setError(null);
      setNow(Date.now());
    } else setError(result.error);
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<BoardColumnKey, BoardTicket[]>(BOARD_COLUMNS.map((column) => [column.key, []]));
    for (const ticket of board?.tickets ?? []) if (matches(ticket, query.trim())) map.get(ticket.column)!.push(ticket);
    return map;
  }, [board, query]);

  const stuckCount = board?.tickets.filter((ticket) => ticket.stuck).length ?? 0;

  if (board && !board.event) {
    return <EmptyState title="No active event. An admin needs to create and activate this year's Maintenance Week." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" strokeWidth={1.75} />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tag, code, university ID, name…" className="pl-9" aria-label="Search tickets" />
        </div>
        <Button icon={<UserPlus className="h-4 w-4" strokeWidth={1.75} />} onClick={() => setWalkIn(true)} disabled={!board?.event}>
          Register walk-in
        </Button>
        <Button variant="secondary" icon={<HandHelping className="h-4 w-4" strokeWidth={1.75} />} onClick={() => setPickup(true)}>
          Pickup
        </Button>
        <Button variant="ghost" icon={<CalendarCheck className="h-4 w-4" strokeWidth={1.75} />} onClick={() => setEnding(true)} disabled={!board?.event}>
          End of event
        </Button>
        {stuckCount ? <span className="rounded-full bg-warning-soft px-3 py-1 text-caption font-semibold text-warning-text">{stuckCount} stuck</span> : null}
        <button type="button" onClick={() => void load()} className="ml-auto flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink" aria-label="Refresh">
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
          {board ? `Updated ${new Date(board.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Loading…"}
        </button>
      </div>
      {error ? <p className="text-small text-error-text">{error}</p> : null}

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-7 sm:px-7">
        {BOARD_COLUMNS.map((column) => {
          const tickets = grouped.get(column.key) ?? [];
          return (
            <BoardColumn key={column.key} title={column.title} count={tickets.length}>
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} now={now} onOpen={() => setSelected(ticket.id)} />
              ))}
              {tickets.length === 0 ? <p className="px-2 py-6 text-center text-caption text-ink-muted">Nothing here</p> : null}
            </BoardColumn>
          );
        })}
      </div>

      {board?.event ? (
        <Dialog open={walkIn} onClose={() => setWalkIn(false)} variant="sheet" title="Register walk-in">
          {walkIn ? (
            <RequestForm
              event={board.event}
              endpoint="/api/staff/requests"
              onCreated={(code) => {
                setWalkIn(false);
                setSelected(code);
                void load();
              }}
            />
          ) : null}
        </Dialog>
      ) : null}

      {board?.event ? (
        <Dialog open={ending} onClose={() => setEnding(false)} variant="sheet" title="End of event">
          {ending ? <EndOfEventPanel eventId={board.event.id} holdDays={board.event.holdDays} onChanged={() => void load()} /> : null}
        </Dialog>
      ) : null}

      <Dialog open={pickup} onClose={() => setPickup(false)} variant="sheet" title="Pickup">
        {pickup ? <PickupSearch onChanged={() => void load()} /> : null}
      </Dialog>

      <TicketSheet
        ticketId={selected}
        onClose={() => setSelected(null)}
        actions={(ticket, reload) => {
          const done = () => {
            reload();
            void load();
          };
          return (
            <>
              <DeskActions ticket={ticket} technicians={board?.technicians ?? []} onDone={done} />
              <UndoControl ticket={ticket} isAdmin={isAdmin} onDone={done} />
            </>
          );
        }}
      />
    </div>
  );
}
