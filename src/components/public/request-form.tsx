"use client";

import { ArrowLeft, ArrowRight, Check, Copy, Laptop, Monitor, MonitorSmartphone, Tablet, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";
import type { ZodType } from "zod";
import { Button, ButtonLink, Card, ChoiceCard, ChoiceGroup, Eyebrow, Field, Input, Select, Stepper, Textarea } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import { intakeDeviceSchema, intakeProblemSchema, intakeRequesterSchema } from "@/lib/intake/intake-schema";
import {
  ACCESSORIES,
  BRANDS,
  DEVICE_AGES,
  DEVICE_TYPES,
  OPERATING_SYSTEMS,
  RAM_SIZES,
  REQUESTER_TYPES,
  STORAGE_TYPES,
  labelOf,
} from "@/lib/intake/options";

export type RequestFormEvent = { name: string; venue: string; hours: string; dates: string; holdDays: number };

type Values = {
  requester: { requesterType: string; fullName: string; universityId: string; phone: string; faculty: string; department: string; email: string };
  device: {
    deviceType: string;
    brand: string;
    brandOther: string;
    model: string;
    operatingSystem: string;
    ram: string;
    storageType: string;
    ageBand: string;
    serialNumber: string;
    accessories: string[];
  };
  problem: { description: string };
  wipeAllowed: boolean;
  needsPassword: boolean;
  consent: boolean;
  website: string;
};

const EMPTY: Values = {
  requester: { requesterType: "STUDENT", fullName: "", universityId: "", phone: "", faculty: "", department: "", email: "" },
  device: { deviceType: "", brand: "", brandOther: "", model: "", operatingSystem: "", ram: "", storageType: "", ageBand: "", serialNumber: "", accessories: [] },
  problem: { description: "" },
  wipeAllowed: false,
  needsPassword: false,
  consent: false,
  website: "",
};

type Errors = Record<string, string | undefined>;

const STEPS = ["You", "Device", "Problem", "Review"] as const;
const STEP_OF: Record<string, number> = { requester: 0, device: 1, problem: 2 };
const deviceIcons: Record<string, ReactNode> = {
  LAPTOP: <Laptop className="h-5 w-5" strokeWidth={1.75} />,
  DESKTOP: <Monitor className="h-5 w-5" strokeWidth={1.75} />,
  ALL_IN_ONE: <MonitorSmartphone className="h-5 w-5" strokeWidth={1.75} />,
  TABLET: <Tablet className="h-5 w-5" strokeWidth={1.75} />,
  OTHER: <HelpCircle className="h-5 w-5" strokeWidth={1.75} />,
};

function validate(schema: ZodType, value: unknown, prefix: string): Errors {
  const result = schema.safeParse(value);
  if (result.success) return {};
  const errors: Errors = {};
  for (const issue of result.error.issues) {
    const key = [prefix, ...issue.path].filter(Boolean).join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

function Success({ code, firstName, event }: { code: string; firstName: string; event: RequestFormEvent }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card focal className="flex flex-col gap-6 p-6 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
        <Check className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="text-h1 text-ink">Thank you, {firstName}</h2>
        <p className="text-body text-ink-secondary">Your request is registered. Keep this code to track your repair.</p>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-muted px-4 py-3">
        <span className="whitespace-nowrap font-mono text-[20px] font-semibold tracking-wide text-ink sm:text-[24px]">{code}</span>
        <Button
          variant="secondary"
          size="sm"
          icon={copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
          onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true))}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="flex flex-col gap-1 rounded-md bg-accent-soft px-4 py-3 text-small text-ink">
        <p className="font-semibold">Next: bring your device</p>
        <p className="text-ink-secondary">
          {event.venue} · {event.hours} · {event.dates}. Bring your university ID card and the charger.
        </p>
      </div>
      <ButtonLink href={`/track?code=${encodeURIComponent(code)}`} className="self-start">
        Track my repair
      </ButtonLink>
    </Card>
  );
}

export function RequestForm({ event, endpoint = "/api/public/repair-requests", onCreated }: { event: RequestFormEvent; endpoint?: string; onCreated?: (code: string) => void }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<ReactNode>(null);
  const [created, setCreated] = useState<{ code: string; firstName: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  if (created && !onCreated) return <Success code={created.code} firstName={created.firstName} event={event} />;

  function update<S extends "requester" | "device" | "problem">(section: S, field: keyof Values[S], value: unknown) {
    setValues((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
    setErrors((current) => ({ ...current, [`${section}.${String(field)}`]: undefined }));
  }

  const error = (path: string) => errors[path];
  const goTo = (next: number) => {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  function next() {
    const stepErrors =
      step === 0
        ? validate(intakeRequesterSchema, values.requester, "requester")
        : step === 1
          ? validate(intakeDeviceSchema, values.device, "device")
          : validate(intakeProblemSchema, values.problem, "problem");
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) goTo(step + 1);
  }

  function submit() {
    if (!values.consent) {
      setErrors({ consent: "Please accept to continue." });
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = await sendJson<{ request: { trackingCode: string; firstName: string } }>(endpoint, "POST", values);
      if (result.ok) {
        if (onCreated) onCreated(result.data.request.trackingCode);
        else {
          setCreated({ code: result.data.request.trackingCode, firstName: result.data.request.firstName });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      const fieldErrors = Object.fromEntries(Object.entries(result.issues).map(([key, messages]) => [key, messages?.[0]]));
      setErrors(fieldErrors);
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey && STEP_OF[firstKey.split(".")[0]] !== undefined) goTo(STEP_OF[firstKey.split(".")[0]]);
      const existing = result.code === "DUPLICATE" ? (result.details?.trackingCode as string | undefined) : undefined;
      setFormError(
        existing ? (
          <>
            {result.error}{" "}
            <Link className="font-semibold underline" href={`/track?code=${encodeURIComponent(existing)}`}>
              Track it
            </Link>
          </>
        ) : (
          result.error
        ),
      );
    });
  }

  const r = values.requester;
  const d = values.device;

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-6">
      <Stepper steps={[...STEPS]} current={step} />

      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        {step === 0 ? (
          <>
            <ChoiceGroup legend="I am" columns={3} error={error("requester.requesterType")}>
              {REQUESTER_TYPES.map((option) => (
                <ChoiceCard key={option.value} name="requesterType" label={option.label} checked={r.requesterType === option.value} onChange={() => update("requester", "requesterType", option.value)} />
              ))}
            </ChoiceGroup>
            <Field label="Full name" error={error("requester.fullName")}>
              <Input autoComplete="name" value={r.fullName} onChange={(e) => update("requester", "fullName", e.target.value)} aria-invalid={Boolean(error("requester.fullName"))} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="University ID" error={error("requester.universityId")}>
                <Input
                  value={r.universityId}
                  onChange={(e) => update("requester", "universityId", e.target.value)}
                  placeholder="CS383833"
                  autoCapitalize="characters"
                  className="font-mono uppercase"
                  aria-invalid={Boolean(error("requester.universityId"))}
                />
              </Field>
              <Field label="WhatsApp number" error={error("requester.phone")}>
                <Input type="tel" autoComplete="tel" inputMode="tel" value={r.phone} onChange={(e) => update("requester", "phone", e.target.value)} placeholder="061 234 5678" aria-invalid={Boolean(error("requester.phone"))} />
              </Field>
              <Field label="Faculty" optional>
                <Input value={r.faculty} onChange={(e) => update("requester", "faculty", e.target.value)} />
              </Field>
              <Field label="Department" optional>
                <Input value={r.department} onChange={(e) => update("requester", "department", e.target.value)} />
              </Field>
            </div>
            <Field label="Email" optional error={error("requester.email")}>
              <Input type="email" autoComplete="email" value={r.email} onChange={(e) => update("requester", "email", e.target.value)} aria-invalid={Boolean(error("requester.email"))} />
            </Field>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <ChoiceGroup legend="Device" columns={3} error={error("device.deviceType")}>
              {DEVICE_TYPES.map((option) => (
                <ChoiceCard key={option.value} name="deviceType" label={option.label} icon={deviceIcons[option.value]} checked={d.deviceType === option.value} onChange={() => update("device", "deviceType", option.value)} />
              ))}
            </ChoiceGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Brand" error={error("device.brand")}>
                <Select value={d.brand} onChange={(e) => update("device", "brand", e.target.value)} aria-invalid={Boolean(error("device.brand"))}>
                  <option value="">Choose…</option>
                  {BRANDS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {d.brand === "OTHER" ? (
                <Field label="Which brand?" error={error("device.brandOther")}>
                  <Input value={d.brandOther} onChange={(e) => update("device", "brandOther", e.target.value)} aria-invalid={Boolean(error("device.brandOther"))} />
                </Field>
              ) : null}
              <Field label="Model" hint="On the sticker under the laptop." error={error("device.model")} className={d.brand === "OTHER" ? "sm:col-span-2" : undefined}>
                <Input value={d.model} onChange={(e) => update("device", "model", e.target.value)} placeholder="ProBook 450 G8" aria-invalid={Boolean(error("device.model"))} />
              </Field>
              <Field label="System" error={error("device.operatingSystem")}>
                <Select value={d.operatingSystem} onChange={(e) => update("device", "operatingSystem", e.target.value)} aria-invalid={Boolean(error("device.operatingSystem"))}>
                  <option value="">Choose…</option>
                  {OPERATING_SYSTEMS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Memory (RAM)" error={error("device.ram")}>
                <Select value={d.ram} onChange={(e) => update("device", "ram", e.target.value)} aria-invalid={Boolean(error("device.ram"))}>
                  <option value="">Choose…</option>
                  {RAM_SIZES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Storage" error={error("device.storageType")}>
                <Select value={d.storageType} onChange={(e) => update("device", "storageType", e.target.value)} aria-invalid={Boolean(error("device.storageType"))}>
                  <option value="">Choose…</option>
                  {STORAGE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Age" error={error("device.ageBand")}>
                <Select value={d.ageBand} onChange={(e) => update("device", "ageBand", e.target.value)} aria-invalid={Boolean(error("device.ageBand"))}>
                  <option value="">Choose…</option>
                  {DEVICE_AGES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <details className="rounded-md bg-muted px-4 py-3 text-small text-ink-secondary">
              <summary className="cursor-pointer font-medium text-ink">How to find your specs</summary>
              <p className="mt-2">Windows: Settings → System → About. Mac: Apple menu → About This Mac. Not sure? Choose &ldquo;Don&apos;t know&rdquo;.</p>
            </details>
            <Field label="Serial number" optional>
              <Input value={d.serialNumber} onChange={(e) => update("device", "serialNumber", e.target.value)} className="font-mono" />
            </Field>
            <ChoiceGroup legend="I'm leaving with the device" columns={2}>
              {ACCESSORIES.map((option) => (
                <ChoiceCard
                  key={option.value}
                  type="checkbox"
                  label={option.label}
                  checked={d.accessories.includes(option.value)}
                  onChange={(e) => update("device", "accessories", e.target.checked ? [...d.accessories, option.value] : d.accessories.filter((value) => value !== option.value))}
                />
              ))}
            </ChoiceGroup>
          </>
        ) : null}

        {step === 2 ? (
          <Field label="What's wrong?" hint="When did it start? What do you see?" error={error("problem.description")}>
            <Textarea
              rows={5}
              value={values.problem.description}
              onChange={(e) => update("problem", "description", e.target.value)}
              placeholder="It turns on but the screen stays black…"
              aria-invalid={Boolean(error("problem.description"))}
            />
          </Field>
        ) : null}

        {step === 3 ? (
          <>
            <Eyebrow>Check your request</Eyebrow>
            <dl className="grid gap-x-6 gap-y-3 text-small sm:grid-cols-2">
              {[
                ["Name", r.fullName],
                ["University ID", r.universityId.toUpperCase()],
                ["WhatsApp", r.phone],
                ["Device", `${d.brand === "OTHER" ? d.brandOther : labelOf(BRANDS, d.brand)} ${d.model} · ${labelOf(DEVICE_TYPES, d.deviceType)}`],
                ["Specs", `${labelOf(OPERATING_SYSTEMS, d.operatingSystem)} · ${labelOf(RAM_SIZES, d.ram)} · ${labelOf(STORAGE_TYPES, d.storageType)}`],
                ["Leaving", d.accessories.length ? d.accessories.map((value) => labelOf(ACCESSORIES, value)).join(", ") : "Device only"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Problem</dt>
                <dd className="text-ink">{values.problem.description}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2 border-t border-line pt-5">
              <ChoiceCard type="checkbox" label="OK to reinstall Windows if needed" description="Files not backed up may be lost." checked={values.wipeAllowed} onChange={(e) => setValues((v) => ({ ...v, wipeAllowed: e.target.checked }))} />
              <ChoiceCard type="checkbox" label="The technician will need my password" description="You'll give it at the desk, never online." checked={values.needsPassword} onChange={(e) => setValues((v) => ({ ...v, needsPassword: e.target.checked }))} />
              <ChoiceCard
                type="checkbox"
                label="I have backed up my files and accept the rules"
                description={`SIMAD IT is not responsible for data loss. Devices not collected are kept ${event.holdDays} days after the event.`}
                checked={values.consent}
                onChange={(e) => {
                  setValues((v) => ({ ...v, consent: e.target.checked }));
                  setErrors((current) => ({ ...current, consent: undefined }));
                }}
              />
              {error("consent") ? (
                <p className="text-caption text-error-text" role="alert">
                  {error("consent")}
                </p>
              ) : null}
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={values.website} onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))} />
          </>
        ) : null}
      </Card>

      {formError ? (
        <p className="rounded-md bg-error-soft px-4 py-3 text-small text-error-text" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />} onClick={() => goTo(step - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <Button size="lg" onClick={next}>
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        ) : (
          <Button size="lg" loading={pending} onClick={submit}>
            Send request
          </Button>
        )}
      </div>
    </div>
  );
}
