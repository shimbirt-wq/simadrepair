"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_CATEGORY_OPTIONS,
  REQUESTER_TYPE_LABELS,
} from "@/lib/service-desk/constants";

type FieldName =
  | "fullName"
  | "requesterType"
  | "universityId"
  | "faculty"
  | "department"
  | "phone"
  | "email"
  | "deviceType"
  | "brand"
  | "model"
  | "issueCategory"
  | "issueDescription";

type FormErrors = Partial<Record<FieldName | "form", string>>;

type PublicRepairRequestResult = {
  trackingCode: string;
  requesterName: string;
  submittedAt: string;
};

type PublicRepairRequestApiResponse = {
  error?: string;
  request?: PublicRepairRequestResult;
};

const requesterTypeOptions = Object.entries(REQUESTER_TYPE_LABELS);

const defaultValues: Record<FieldName, string> = {
  fullName: "",
  requesterType: "STUDENT",
  universityId: "",
  faculty: "",
  department: "",
  phone: "",
  email: "",
  deviceType: "",
  brand: "",
  model: "",
  issueCategory: "",
  issueDescription: "",
};

function getFormValues(formData: FormData): Record<FieldName, string> {
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    requesterType: String(formData.get("requesterType") ?? "").trim(),
    universityId: String(formData.get("universityId") ?? "").trim(),
    faculty: String(formData.get("faculty") ?? "").trim(),
    department: String(formData.get("department") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    deviceType: String(formData.get("deviceType") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    issueCategory: String(formData.get("issueCategory") ?? "").trim(),
    issueDescription: String(formData.get("issueDescription") ?? "").trim(),
  };
}

function validateValues(values: Record<FieldName, string>): FormErrors {
  const errors: FormErrors = {};

  if (values.fullName.length < 2) {
    errors.fullName = "Enter your full name.";
  }

  if (!values.requesterType) {
    errors.requesterType = "Select whether you are a student or lecturer.";
  }

  if (!values.universityId) {
    errors.universityId = "Enter your SIMAD ID.";
  }

  if (!values.faculty) {
    errors.faculty = "Enter your faculty.";
  }

  if (!values.department) {
    errors.department = "Enter your department.";
  }

  if (values.phone.length < 7) {
    errors.phone = "Enter a reachable phone number.";
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address or leave it blank.";
  }

  if (values.deviceType.length < 2) {
    errors.deviceType = "Enter the device type.";
  }

  if (values.brand.length < 2) {
    errors.brand = "Enter the device brand.";
  }

  if (values.model.length < 2) {
    errors.model = "Enter the device model.";
  }

  if (!ISSUE_CATEGORY_OPTIONS.includes(values.issueCategory as (typeof ISSUE_CATEGORY_OPTIONS)[number])) {
    errors.issueCategory = "Select the closest issue category.";
  }

  if (values.issueDescription.length < 10) {
    errors.issueDescription = "Describe the problem in at least 10 characters.";
  }

  return errors;
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-[var(--danger)]">{message}</p>;
}

function FieldLabel({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      {children}
      <ErrorMessage message={error} />
    </label>
  );
}

export function PublicRepairRequestForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<PublicRepairRequestResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = getFormValues(new FormData(form));
    const nextErrors = validateValues(values);

    setResult(null);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/public/repair-requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          requester: {
            requesterType: values.requesterType,
            fullName: values.fullName,
            universityId: values.universityId,
            faculty: values.faculty,
            department: values.department,
            phone: values.phone,
            ...(values.email ? { email: values.email } : {}),
          },
          deviceType: values.deviceType,
          brand: values.brand,
          model: values.model,
          issueCategory: values.issueCategory,
          issueDescription: values.issueDescription,
        }),
      });

      const body = (await response.json().catch(() => null)) as PublicRepairRequestApiResponse | null;

      if (!response.ok || !body?.request) {
        setErrors({
          form: body?.error ?? "Unable to submit the repair request. Check the form and try again.",
        });
        return;
      }

      setErrors({});
      setResult(body.request);
      form.reset();
    });
  }

  if (result) {
    const submittedAt = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(result.submittedAt));

    return (
      <section className="panel p-6">
        <p className="eyebrow">Request submitted</p>
        <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">Your repair request is registered.</h2>
        <div className="mt-6 grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Tracking code</p>
            <p className="tracking-code mt-1 break-all text-2xl font-black text-[var(--foreground)]">{result.trackingCode}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Requester</p>
              <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{result.requesterName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Submitted</p>
              <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{submittedAt}</p>
            </div>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-[var(--muted-strong)]">
          Save this tracking code. You will use it to check your repair status.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/track?code=${encodeURIComponent(result.trackingCode)}`} className="btn-primary">
            Track this request
          </Link>
          <button type="button" className="btn-secondary" onClick={() => setResult(null)}>
            Submit another request
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="panel p-6">
      <div>
        <p className="eyebrow">Repair request</p>
        <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">Tell us what needs repair.</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
          Use your SIMAD details so the maintenance team can identify your request and contact you.
        </p>
      </div>

      {errors.form ? (
        <div className="mt-5 rounded-lg border border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-4">
          <ErrorMessage message={errors.form} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <fieldset className="grid gap-4">
          <legend className="text-sm font-bold text-[var(--foreground)]">Your details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Full name" error={errors.fullName}>
              <input name="fullName" defaultValue={defaultValues.fullName} className="field-control" autoComplete="name" />
            </FieldLabel>
            <FieldLabel label="Requester type" error={errors.requesterType}>
              <select name="requesterType" defaultValue={defaultValues.requesterType} className="field-control">
                {requesterTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="SIMAD ID" error={errors.universityId}>
              <input name="universityId" className="field-control" autoComplete="off" />
            </FieldLabel>
            <FieldLabel label="Phone" error={errors.phone}>
              <input name="phone" className="field-control" autoComplete="tel" inputMode="tel" />
            </FieldLabel>
            <FieldLabel label="Faculty" error={errors.faculty}>
              <input name="faculty" className="field-control" autoComplete="organization" />
            </FieldLabel>
            <FieldLabel label="Department" error={errors.department}>
              <input name="department" className="field-control" autoComplete="organization-title" />
            </FieldLabel>
            <FieldLabel label="Email optional" error={errors.email}>
              <input name="email" type="email" className="field-control" autoComplete="email" />
            </FieldLabel>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-sm font-bold text-[var(--foreground)]">Device details</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldLabel label="Device type" error={errors.deviceType}>
              <input name="deviceType" className="field-control" placeholder="Laptop, desktop, tablet" />
            </FieldLabel>
            <FieldLabel label="Brand" error={errors.brand}>
              <input name="brand" className="field-control" placeholder="HP, Dell, Lenovo" />
            </FieldLabel>
            <FieldLabel label="Model" error={errors.model}>
              <input name="model" className="field-control" placeholder="ProBook 450 G8" />
            </FieldLabel>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-sm font-bold text-[var(--foreground)]">Issue details</legend>
          <FieldLabel label="Issue category" error={errors.issueCategory}>
            <select name="issueCategory" defaultValue={defaultValues.issueCategory} className="field-control">
              <option value="">Select a category</option>
              {ISSUE_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {ISSUE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Issue description" error={errors.issueDescription}>
            <textarea
              name="issueDescription"
              rows={5}
              className="field-control"
              placeholder="Describe what is happening, when it started, and any error message you see."
            />
          </FieldLabel>
        </fieldset>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Submitting..." : "Submit repair request"}
        </button>
        <p className="text-sm text-[var(--muted)]">No login is required.</p>
      </div>
    </form>
  );
}
