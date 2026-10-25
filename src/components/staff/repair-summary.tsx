import { CircleCheck } from "lucide-react";
import { Badge, Eyebrow } from "@/components/ui";
import type { StaffTicketDetail } from "@/lib/tickets/ticket-detail";

export function RepairSummary({ repair }: { repair: NonNullable<StaffTicketDetail["repair"]> }) {
  return (
    <section className="flex flex-col gap-2">
      <Eyebrow>Repair</Eyebrow>
      <p className="text-small text-ink-secondary">
        Fault: <span className="font-medium text-ink">{repair.faults.join(", ")}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {repair.actions.map((action) => (
          <Badge key={action} tone="accent">
            {action}
          </Badge>
        ))}
      </div>
      {repair.note ? <p className="text-small text-ink">{repair.note}</p> : null}
      <p className="flex items-center gap-1.5 text-caption text-success-text">
        <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} />
        Tested: {repair.tests.join(", ")}
      </p>
    </section>
  );
}
