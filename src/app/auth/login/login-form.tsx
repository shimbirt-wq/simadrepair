"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Sign in</p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Access your workspace</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Use your account to view your profile or, if you are an admin, open the user management area.
      </p>

      <div className="mt-8 grid gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Password
          <input
            type="password"
            name="password"
            required
            className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm text-[#9f2c2c]">{state.error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
        <Link
          href="/auth/register"
          className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
        >
          Create account
        </Link>
      </div>
    </form>
  );
}
