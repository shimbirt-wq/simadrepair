"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeviceFormProps = {
  ownerId?: string;
};

export function DeviceForm({ ownerId }: DeviceFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = {
      ownerId,
      deviceType: String(formData.get("deviceType") ?? "").trim(),
      brand: String(formData.get("brand") ?? "").trim(),
      model: String(formData.get("model") ?? "").trim(),
      serialNumber: String(formData.get("serialNumber") ?? "").trim() || undefined,
    };

    startTransition(async () => {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Unable to create the device.");
        return;
      }

      setMessage("Device created successfully.");
      router.refresh();
      form.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Register device</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Device type
          <input
            name="deviceType"
            required
            placeholder="Laptop"
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Brand
          <input
            name="brand"
            required
            placeholder="Lenovo"
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Model
          <input
            name="model"
            required
            placeholder="ThinkPad T14"
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Serial number
          <input
            name="serialNumber"
            placeholder="Optional"
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
      </div>

      {message ? <p className="mt-4 text-sm text-[var(--muted-strong)]">{message}</p> : null}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create device"}
        </button>
      </div>
    </form>
  );
}
