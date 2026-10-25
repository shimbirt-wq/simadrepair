"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeTrackingCode } from "@/lib/tickets/tracking-code-format";

/** Tracking-code input in the hero: valid code → tracking page, otherwise a one-line error. */
export function HeroTrack() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex w-full max-w-md flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeTrackingCode(code);
        if (!normalized) {
          setError(code.trim() ? "That doesn't look like a tracking code, e.g. SIM-26-K7P3QX." : "Enter your tracking code.");
          return;
        }
        router.push(`/track?code=${encodeURIComponent(normalized)}`);
      }}
    >
      <label htmlFor="hero-track" className="text-small font-semibold text-ink">
        Already registered? Track your repair
      </label>
      <div className="flex h-12 items-center rounded-md border border-line-strong bg-surface pl-4 pr-1.5 focus-within:border-accent focus-within:shadow-focus">
        <input
          id="hero-track"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(null);
          }}
          placeholder="SIM-26-K7P3QX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "hero-track-error" : undefined}
          className="min-w-0 flex-1 bg-transparent font-mono text-body uppercase tracking-wide text-ink outline-none placeholder:normal-case placeholder:text-ink-disabled"
        />
        <button type="submit" className="flex h-9 items-center gap-1.5 rounded-sm px-3 text-small font-semibold text-ink-accent hover:bg-accent-soft focus-visible:shadow-focus focus-visible:outline-none">
          Track
          <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
      {error ? (
        <p id="hero-track-error" role="alert" className="text-caption text-error-text">
          {error}
        </p>
      ) : null}
    </form>
  );
}
