"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type RepairTicketFormProps = {
  devices: Array<{
    id: string;
    brand: string;
    model: string;
    deviceType: string;
  }>;
};

export function RepairTicketForm({ devices }: RepairTicketFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await fetch("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          deviceId: String(formData.get("deviceId") ?? ""),
          issueDescription: String(formData.get("issueDescription") ?? "").trim(),
          photoUrl: String(formData.get("photoUrl") ?? "").trim() || undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string; ticket?: { ticketId: string } } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Unable to create the repair ticket.");
        return;
      }

      setMessage(`Ticket created successfully: ${body?.ticket?.ticketId ?? "New ticket"}`);
      router.refresh();
      form.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Repair request</p>
      <div className="mt-6 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Registered device
          <select
            name="deviceId"
            required
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          >
            <option value="">Select a device</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.brand} {device.model} ({device.deviceType})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Problem description
          <textarea
            name="issueDescription"
            required
            rows={5}
            placeholder="Describe the issue clearly so the technician can start from the right context."
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Photo URL
          <input
            name="photoUrl"
            placeholder="Optional"
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
      </div>

      {message ? <p className="mt-4 text-sm text-[var(--muted-strong)]">{message}</p> : null}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isPending || devices.length === 0}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Submitting..." : "Create ticket"}
        </button>
      </div>
    </form>
  );
}
