"use client";

import { Copy, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, Card, ChoiceCard, ChoiceGroup, Dialog, Field, Select, Textarea, useToast, cn } from "@/components/ui";
import { sendJson } from "@/lib/client/api";

export type StaffRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN";
  skills: string[];
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  expiresOn: string | null;
};

const SKILLS = [
  { value: "HARDWARE", label: "Hardware" },
  { value: "SOFTWARE", label: "Software/OS" },
  { value: "NETWORK", label: "Network" },
];
const ROLE_LABEL = { ADMIN: "Admin", LEAD_TECHNICIAN: "Lead technician", TECHNICIAN: "Technician" } as const;

type BulkResult = { line: number; ok: true; fullName: string; email: string; password: string } | { line: number; ok: false; raw: string; error: string };

function BulkAdd({ eventName, onClose }: { eventName: string | null; onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const created = results?.filter((row): row is Extract<BulkResult, { ok: true }> => row.ok) ?? [];
  const failed = results?.filter((row): row is Extract<BulkResult, { ok: false }> => !row.ok) ?? [];

  if (results) {
    const sheet = created.map((row) => `${row.fullName}\t${row.email}\t${row.password}`).join("\n");
    return (
      <div className="flex flex-col gap-4">
        <p className="text-small text-ink-secondary">
          {created.length} account{created.length === 1 ? "" : "s"} created. Passwords are shown only now — copy them before closing.
        </p>
        {created.length ? (
          <Card className="overflow-hidden">
            <table className="w-full text-small">
              <tbody>
                {created.map((row) => (
                  <tr key={row.email} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 font-medium text-ink">{row.fullName}</td>
                    <td className="px-3 py-2 text-ink-secondary">{row.email}</td>
                    <td className="px-3 py-2 font-mono text-ink">{row.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : null}
        {failed.map((row) => (
          <p key={row.line} className="text-caption text-error-text">
            Line {row.line} ({row.raw}): {row.error}
          </p>
        ))}
        <div className="flex gap-2">
          {created.length ? (
            <Button variant="secondary" icon={<Copy className="h-4 w-4" strokeWidth={1.75} />} onClick={() => navigator.clipboard?.writeText(sheet)}>
              Copy all
            </Button>
          ) : null}
          <Button
            onClick={() => {
              router.refresh();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Volunteers" hint="One per line: name, email, phone. Paste from a spreadsheet." error={error}>
        <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Ahmed Nur, ahmed@simad.edu.so, 061 234 5678\nHodan Ali, hodan@simad.edu.so, 061 765 4321"} className="font-mono text-small" />
      </Field>
      <ChoiceGroup legend="Skills for everyone in this list" columns={3}>
        {SKILLS.map((skill) => (
          <ChoiceCard key={skill.value} type="checkbox" label={skill.label} checked={skills.includes(skill.value)} onChange={(e) => setSkills((list) => (e.target.checked ? [...list, skill.value] : list.filter((v) => v !== skill.value)))} />
        ))}
      </ChoiceGroup>
      <p className="text-caption text-ink-muted">{eventName ? `Access ends after the last day of ${eventName}.` : "No active event: these accounts will not expire."}</p>
      <Button
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await sendJson<{ results: BulkResult[] }>("/api/admin/staff", "POST", { text, skills });
            if (result.ok) setResults(result.data.results);
            else setError(result.issues.text?.[0] ?? result.error);
          })
        }
      >
        Create accounts
      </Button>
    </div>
  );
}

function StaffRowView({ row, eventName, isSelf }: { row: StaffRow; eventName: string | null; isSelf: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function patch(body: Record<string, unknown>, success: string) {
    startTransition(async () => {
      const result = await sendJson(`/api/admin/staff/${row.id}`, "PATCH", body);
      if (!result.ok) toast.error(result.error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  }

  return (
    <tr className={cn("border-b border-line last:border-0", pending && "opacity-60")}>
      <td className="px-4 py-3">
        <p className="font-medium text-ink">{row.fullName}</p>
        <p className="text-caption text-ink-muted">{row.email}</p>
      </td>
      <td className="px-4 py-3">
        <Select value={row.role} onChange={(e) => patch({ role: e.target.value }, "Role updated")} className="h-9 min-w-40 text-small" disabled={isSelf} aria-label={`Role of ${row.fullName}`}>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((skill) => {
            const on = row.skills.includes(skill.value);
            return (
              <button
                key={skill.value}
                type="button"
                aria-pressed={on}
                onClick={() => patch({ skills: on ? row.skills.filter((v) => v !== skill.value) : [...row.skills, skill.value] }, "Skills updated")}
                className={on ? "rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-medium text-ink-accent" : "rounded-full border border-line px-2.5 py-0.5 text-caption text-ink-muted hover:border-line-strong"}
              >
                {skill.label}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-4 py-3">
        {row.status === "ACTIVE" ? <Badge tone="success">Active{row.expiresOn ? ` · until ${row.expiresOn}` : ""}</Badge> : null}
        {row.status === "INACTIVE" ? <Badge tone="muted">Inactive</Badge> : null}
        {row.status === "EXPIRED" ? <Badge tone="warning">Expired {row.expiresOn}</Badge> : null}
      </td>
      <td className="px-4 py-3 text-right">
        {row.status === "EXPIRED" && eventName ? (
          <Button size="sm" variant="secondary" onClick={() => patch({ renew: true }, "Access renewed")}>
            Renew for {eventName}
          </Button>
        ) : !isSelf ? (
          <Button size="sm" variant="ghost" onClick={() => patch({ isActive: row.status !== "ACTIVE" }, row.status === "ACTIVE" ? "Deactivated" : "Activated")}>
            {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
        ) : null}
      </td>
    </tr>
  );
}

export function StaffTable({ rows, eventName, currentUserId }: { rows: StaffRow[]; eventName: string | null; currentUserId: string }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon={<UserPlus className="h-4 w-4" strokeWidth={1.75} />} onClick={() => setAdding(true)}>
          Add volunteers
        </Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-small">
          <thead className="bg-muted text-caption uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Skills</th>
              <th className="px-4 py-2.5 font-medium">Access</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <StaffRowView key={row.id} row={row} eventName={eventName} isSelf={row.id === currentUserId} />
            ))}
          </tbody>
        </table>
      </Card>
      <Dialog open={adding} onClose={() => setAdding(false)} variant="sheet" title="Add volunteers">
        {adding ? <BulkAdd eventName={eventName} onClose={() => setAdding(false)} /> : null}
      </Dialog>
    </div>
  );
}
