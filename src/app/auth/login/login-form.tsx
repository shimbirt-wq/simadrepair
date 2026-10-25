"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getPostLoginRedirectPath } from "@/app/auth/login/redirects";
import { Button, Field, Input } from "@/components/ui";

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const body = (await response.json().catch(() => null)) as { error?: string; user?: { role?: string } } | null;
      if (!response.ok) {
        setError(body?.error ?? "Unable to sign in.");
        return;
      }
      router.push(getPostLoginRedirectPath(nextPath, body?.user?.role));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Email">
        <Input type="email" name="email" required autoComplete="email" placeholder="you@simad.edu.so" />
      </Field>
      <Field label="Password">
        <Input type="password" name="password" required autoComplete="current-password" />
      </Field>
      {error ? (
        <p role="alert" className="rounded-md bg-error-soft px-3 py-2 text-small font-medium text-error-text">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={isPending} className="mt-2 w-full">
        Sign in
      </Button>
    </form>
  );
}
