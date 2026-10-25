"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Card, EmptyState, Field, Input, StatusBadge } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import type { FoundRequest } from "@/lib/self-service/self-service";

export function FindRequests() {
  const [universityId, setUniversityId] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [found, setFound] = useState<FoundRequest[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await sendJson<{ requests: FoundRequest[] }>("/api/public/find", "POST", { universityId, phoneLast4 });
            if (result.ok) {
              setFound(result.data.requests);
              setErrors({});
              setError(null);
            } else {
              setErrors(Object.fromEntries(Object.entries(result.issues).map(([k, v]) => [k, v?.[0]])));
              setError(Object.keys(result.issues).length ? null : result.error);
            }
          });
        }}
      >
        <Card className="flex flex-col gap-4 p-6">
          <Field label="University ID" error={errors.universityId}>
            <Input value={universityId} onChange={(e) => setUniversityId(e.target.value)} placeholder="CS383833" className="font-mono uppercase" />
          </Field>
          <Field label="Last 4 digits of your phone" error={errors.phoneLast4}>
            <Input inputMode="numeric" maxLength={4} value={phoneLast4} onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ""))} placeholder="5678" className="max-w-32 font-mono" />
          </Field>
        </Card>
        {error ? <p className="text-small text-error-text">{error}</p> : null}
        <Button type="submit" size="lg" loading={pending} className="self-start">
          Find my requests
        </Button>
      </form>

      {found && found.length === 0 ? <EmptyState title="No open requests match. Check your ID and phone digits, or ask at the desk." /> : null}
      <div className="flex flex-col gap-2.5">
        {found?.map((request) => (
          <Link key={request.trackingCode} href={`/track?code=${encodeURIComponent(request.trackingCode)}`}>
            <Card interactive className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-body font-semibold text-ink">{request.trackingCode}</p>
                <p className="truncate text-small text-ink-secondary">{request.device}</p>
              </div>
              <StatusBadge status={request.status} audience="public" />
              <ChevronRight className="h-5 w-5 text-ink-muted" strokeWidth={1.75} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
