"use client";

import type { RepairStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type StatusUpdateFormProps = {
  currentStatus: RepairStatus;
  nextStatus: RepairStatus;
  nextStatusLabel: string;
  ticketId: string;
};

export function StatusUpdateForm({ currentStatus, nextStatus, nextStatusLabel, ticketId }: StatusUpdateFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/repair-tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Unable to update repair ticket status.");
        return;
      }

      setMessage(`Status updated from ${currentStatus.replaceAll("_", " ")} to ${nextStatusLabel}.`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-[260px] flex-1 flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Next repair journey step
          <input
            value={nextStatusLabel}
            readOnly
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Updating..." : "Advance status"}
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-[var(--muted-strong)]">{message}</p> : null}
    </form>
  );
}
