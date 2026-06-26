"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getPostLoginRedirectPath } from "@/app/auth/login/redirects";

type LoginState = { error: string | null };
const initialState: LoginState = { error: null };

type LoginFormProps = { nextPath: string | null };

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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string; user?: { role?: string } } | null;

      if (!response.ok) {
        setState({ error: body?.error ?? "Unable to sign in." });
        return;
      }

      router.push(getPostLoginRedirectPath(nextPath, body?.user?.role));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "var(--blue-600)",
          marginBottom: 10,
        }}
      >
        Staff access
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        Sign in to your workspace
      </h1>
      <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "var(--text-tertiary)" }}>
        For admin, lead technician, and technician accounts only.
      </p>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          Email address
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@simad.edu.so"
            className="field-control"
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="field-control"
          />
        </label>
      </div>

      {state.error ? (
        <div
          style={{
            marginTop: 16,
            borderRadius: 8,
            background: "var(--danger-bg)",
            border: "1px solid var(--fill-danger-soft-border)",
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--danger)",
            fontWeight: 500,
          }}
        >
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary"
        style={{ marginTop: 24, width: "100%", minHeight: 44, fontSize: 14, fontWeight: 700 }}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <div style={{ marginTop: 20, display: "flex", gap: 16, justifyContent: "center" }}>
        <Link href="/request-repair" style={{ fontSize: 13, color: "var(--text-accent)" }}>
          Submit a repair
        </Link>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <Link href="/track" style={{ fontSize: 13, color: "var(--text-accent)" }}>
          Track a repair
        </Link>
      </div>
    </form>
  );
}
