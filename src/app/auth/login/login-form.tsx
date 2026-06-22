"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";

type LoginState = {
  error: string | null;
};

const initialState: LoginState = {
  error: null,
};

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setState({
          error: body?.error ?? "Unable to sign in.",
        });
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-8">
      <div className="mb-8">
        <SimadRepairLogo className="h-12 w-auto" />
      </div>
      <p className="eyebrow">Sign in</p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Staff workspace access</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Sign in with an admin, lead technician, or technician account. Students and lecturers use the public repair
        request and tracking flow.
      </p>

      <div className="mt-8 grid gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Email
          <input
            type="email"
            name="email"
            required
            className="field-control"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Password
          <input
            type="password"
            name="password"
            required
            className="field-control"
          />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm font-medium text-[var(--danger)]">{state.error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
        <Link href="/request-repair" className="btn-secondary">
          Request repair
        </Link>
        <Link href="/track" className="btn-secondary">
          Track repair
        </Link>
      </div>
    </form>
  );
}
