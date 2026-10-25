"use client";

import { useState } from "react";
import { Button, ChoiceCard, ChoiceGroup, Field, Textarea } from "@/components/ui";
import { FAULTS, REPAIR_ACTIONS, TEST_CHECKS } from "@/lib/tickets/repair-record";

/** Record the fault, the actions and the final tests, then mark ready (TA6, TA7). */
export function ReadyForm({ defaultFaults, onSubmit, onCancel, pending }: { defaultFaults: string[]; onSubmit: (record: Record<string, unknown>) => void; onCancel: () => void; pending: boolean }) {
  const [faults, setFaults] = useState<string[]>(defaultFaults);
  const [actions, setActions] = useState<string[]>([]);
  const [tests, setTests] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const toggle = (list: string[], value: string, on: boolean) => (on ? [...list, value] : list.filter((item) => item !== value));
  const missing = faults.length === 0 ? "Choose what was wrong." : actions.length === 0 ? "Choose what you did." : tests.length < TEST_CHECKS.length ? "Tick every test." : null;

  return (
    <div className="flex flex-col gap-5 border-t border-line pt-5">
      <ChoiceGroup legend="What was wrong?" columns={2}>
        {FAULTS.map((option) => (
          <ChoiceCard key={option.value} type="checkbox" label={option.label} checked={faults.includes(option.value)} onChange={(e) => setFaults((list) => toggle(list, option.value, e.target.checked))} />
        ))}
      </ChoiceGroup>
      <ChoiceGroup legend="What did you do?" columns={2}>
        {REPAIR_ACTIONS.map((option) => (
          <ChoiceCard key={option.value} type="checkbox" label={option.label} checked={actions.includes(option.value)} onChange={(e) => setActions((list) => toggle(list, option.value, e.target.checked))} />
        ))}
      </ChoiceGroup>
      <Field label="Note" optional>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Replaced keyboard; advised the student to update Windows." />
      </Field>
      <ChoiceGroup legend="Tested" columns={1}>
        {TEST_CHECKS.map((option) => (
          <ChoiceCard key={option.value} type="checkbox" label={option.label} checked={tests.includes(option.value)} onChange={(e) => setTests((list) => toggle(list, option.value, e.target.checked))} />
        ))}
      </ChoiceGroup>
      {missing ? <p className="text-caption text-ink-muted">{missing}</p> : null}
      <div className="flex gap-2">
        <Button size="lg" className="flex-1" disabled={Boolean(missing)} loading={pending} onClick={() => onSubmit({ faults, actions, tests, note })}>
          Mark ready
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
