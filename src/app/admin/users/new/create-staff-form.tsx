"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type CreateStaffFormProps = {
  actorRole: "ADMIN" | "LEAD_TECHNICIAN";
};

type FormState =
  | { status: "idle"; error: null }
  | { status: "error"; error: string }
  | { status: "success"; email: string };

export function CreateStaffForm({ actorRole }: CreateStaffFormProps) {
  const [state, setState] = useState<FormState>({ status: "idle", error: null });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "idle", error: null });

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      universityId: String(formData.get("universityId") ?? "").trim(),
      faculty: String(formData.get("faculty") ?? "").trim(),
      department: String(formData.get("department") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "TECHNICIAN"),
    };

    startTransition(async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as { error?: string; user?: { email: string } } | null;

      if (!response.ok) {
        setState({ status: "error", error: body?.error ?? "Failed to create account." });
        return;
      }

      setState({ status: "success", email: body?.user?.email ?? payload.email });
    });
  }

  if (state.status === "success") {
    return (
      <section className="panel p-8">
        <p className="eyebrow">Account created</p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Staff account ready</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          The account for <span className="font-medium text-[var(--foreground)]">{state.email}</span> has been created
          and is active. Share the credentials securely with the new staff member.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setState({ status: "idle", error: null })}
            className="btn-primary"
          >
            Create another
          </button>
          <Link href="/admin/users" className="btn-secondary">
            View all staff
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel p-8">
      <p className="eyebrow">New account</p>
      <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
        {actorRole === "LEAD_TECHNICIAN" ? "Add a technician to the team" : "Create a staff account"}
      </h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        {actorRole === "LEAD_TECHNICIAN"
          ? "New technician accounts are immediately active. Share the credentials securely."
          : "New accounts are immediately active. Share the credentials securely with the staff member."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Full name
          <input name="fullName" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          University ID
          <input name="universityId" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Faculty
          <input name="faculty" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Department
          <input name="department" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Phone
          <input name="phone" required className="field-control" />
        </label>

        <div className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Role
          {actorRole === "ADMIN" ? (
            <select name="role" defaultValue="TECHNICIAN" className="field-control">
              <option value="TECHNICIAN">Technician</option>
              <option value="LEAD_TECHNICIAN">Lead Technician</option>
            </select>
          ) : (
            <>
              <input type="hidden" name="role" value="TECHNICIAN" />
              <span className="field-control bg-[var(--surface-alt)] text-[var(--muted)]">Technician</span>
            </>
          )}
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)] sm:col-span-2">
          Email
          <input type="email" name="email" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)] sm:col-span-2">
          Password
          <input type="password" name="password" required className="field-control" />
        </label>

        {state.status === "error" ? (
          <p className="text-sm font-medium text-[var(--danger)] sm:col-span-2">{state.error}</p>
        ) : null}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create account"}
          </button>
          <Link href="/admin/users" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
