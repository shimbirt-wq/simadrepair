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

/* ── Shared field styles ── */
const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  height: "40px",
  width: "100%",
  padding: "0 12px",
  fontSize: "14px",
  color: "#0f172a",
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  outline: "none",
  transition: "border-color 150ms",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: "32px",
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#dc2626",
  marginTop: "2px",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#94a3b8",
  marginBottom: "14px",
};

/* ── Prefixed input (# for ID, phone icon) ── */
function PrefixInput({
  icon,
  error,
  ...props
}: { icon: React.ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span
          style={{
            position: "absolute",
            left: "12px",
            color: "#94a3b8",
            fontSize: "13px",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </span>
        <input
          {...props}
          style={{ ...inputStyle, paddingLeft: "28px", borderColor: error ? "#fca5a5" : "#d1d5db" }}
        />
      </div>
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

/* ── SuccessModal — unchanged ── */
function SuccessModal({
  result,
  onDismiss,
}: {
  result: PublicRepairRequestResult;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const submittedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(result.submittedAt));

  function handleCopy() {
    navigator.clipboard.writeText(result.trackingCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      style={{ animation: "modal-backdrop-in 200ms ease both" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
      />
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-2xl bg-white"
        style={{
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)",
          animation: "modal-panel-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)" }} />
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center">
              <span
                className="absolute rounded-full"
                style={{ width: 72, height: 72, border: "2px solid #bbf7d0", animation: "pulse-ring 1.4s ease-out 400ms infinite" }}
              />
              <div
                className="relative flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, background: "#f0fdf4", border: "2px solid #bbf7d0" }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="13" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="82"
                    style={{ strokeDashoffset: 82, animation: "check-circle-draw 550ms cubic-bezier(0.4,0,0.2,1) 80ms forwards" }} />
                  <path d="M9.5 16.5l4.5 4.5 8.5-9" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="25"
                    style={{ strokeDashoffset: 25, animation: "check-mark-draw 380ms cubic-bezier(0.4,0,0.2,1) 480ms forwards" }} />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--success)]">Request submitted</p>
            <h2 id="success-modal-title" className="mt-1.5 text-xl font-bold text-[var(--foreground)]">
              Your repair request is registered.
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{result.requesterName} &middot; {submittedAt}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Your tracking code</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="select-all break-all text-2xl font-black text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                {result.trackingCode}
              </p>
              <button type="button" onClick={handleCopy}
                className="flex-shrink-0 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: copied ? "var(--green-200)" : "var(--border-strong)",
                  color: copied ? "var(--success)" : "var(--foreground)",
                  background: copied ? "var(--fill-success-soft)" : "#fff",
                }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-3 rounded-xl p-4" style={{ background: "var(--amber-50)", border: "1px solid var(--amber-200)" }}>
            <div className="flex-shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 2L16.5 15H1.5L9 2Z" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 7.5V10.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="12.75" r="0.75" fill="#d97706" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--amber-800)" }}>Take a screenshot or write this down now</p>
              <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--amber-700)" }}>
                This is the only way to check your repair status or follow up with the team.
                The code will <strong>not</strong> be sent to you by SMS or email unless you provided a contact.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/track?code=${encodeURIComponent(result.trackingCode)}`} className="btn-primary">
              Track this request
            </Link>
            <button type="button" className="btn-secondary" onClick={onDismiss}>
              Submit another request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main form ── */
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

    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      const response = await fetch("/api/public/repair-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
        setErrors({ form: body?.error ?? "Unable to submit the repair request. Check the form and try again." });
        return;
      }

      setErrors({});
      setResult(body.request);
      form.reset();
    });
  }

  return (
    <>
      {result && <SuccessModal result={result} onDismiss={() => setResult(null)} />}

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          padding: "28px 28px 24px",
        }}
      >
        {/* Form-level error */}
        {errors.form && (
          <div
            style={{
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#dc2626",
            }}
          >
            {errors.form}
          </div>
        )}

        {/* ── Section 1: Your details ── */}
        <p style={sectionLabelStyle}>Your details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="sm:grid-cols-2">

          {/* Full name */}
          <label style={labelStyle}>
            Full name <span style={{ color: "#2563eb" }}>*</span>
            <input
              name="fullName"
              defaultValue={defaultValues.fullName}
              autoComplete="name"
              placeholder="e.g. Amina Hassan"
              style={{ ...inputStyle, borderColor: errors.fullName ? "#fca5a5" : "#d1d5db" }}
            />
            {errors.fullName && <p style={errorStyle}>{errors.fullName}</p>}
          </label>

          {/* Requester type */}
          <label style={labelStyle}>
            Requester type <span style={{ color: "#2563eb" }}>*</span>
            <select
              name="requesterType"
              defaultValue={defaultValues.requesterType}
              style={{ ...selectStyle, borderColor: errors.requesterType ? "#fca5a5" : "#d1d5db" }}
            >
              {requesterTypeOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.requesterType && <p style={errorStyle}>{errors.requesterType}</p>}
          </label>

          {/* SIMAD ID */}
          <label style={labelStyle}>
            Student / Staff ID <span style={{ color: "#2563eb" }}>*</span>
            <PrefixInput
              name="universityId"
              autoComplete="off"
              placeholder="19204882"
              icon="#"
              error={errors.universityId}
            />
          </label>

          {/* Phone */}
          <label style={labelStyle}>
            Phone <span style={{ color: "#2563eb" }}>*</span>
            <PrefixInput
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              placeholder="61-2200000"
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16l.19.92Z" />
                </svg>
              }
              error={errors.phone}
            />
          </label>

          {/* Faculty */}
          <label style={labelStyle}>
            Faculty <span style={{ color: "#2563eb" }}>*</span>
            <input
              name="faculty"
              autoComplete="organization"
              placeholder="Engineering"
              style={{ ...inputStyle, borderColor: errors.faculty ? "#fca5a5" : "#d1d5db" }}
            />
            {errors.faculty && <p style={errorStyle}>{errors.faculty}</p>}
          </label>

          {/* Department */}
          <label style={labelStyle}>
            Department <span style={{ color: "#2563eb" }}>*</span>
            <input
              name="department"
              autoComplete="organization-title"
              placeholder="Computer Science"
              style={{ ...inputStyle, borderColor: errors.department ? "#fca5a5" : "#d1d5db" }}
            />
            {errors.department && <p style={errorStyle}>{errors.department}</p>}
          </label>

          {/* Email optional — spans full width */}
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Email <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@simad.edu.so"
              style={{ ...inputStyle, borderColor: errors.email ? "#fca5a5" : "#d1d5db" }}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </label>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: "1px solid #f1f5f9", margin: "22px 0 20px" }} />

        {/* ── Section 2: Device details ── */}
        <p style={sectionLabelStyle}>Device details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }} className="sm:grid-cols-3">
          <label style={labelStyle}>
            Device type <span style={{ color: "#2563eb" }}>*</span>
            <input
              name="deviceType"
              placeholder="Laptop, desktop, tablet"
              style={{ ...inputStyle, borderColor: errors.deviceType ? "#fca5a5" : "#d1d5db" }}
            />
            {errors.deviceType && <p style={errorStyle}>{errors.deviceType}</p>}
          </label>
          <label style={labelStyle}>
            Brand <span style={{ color: "#2563eb" }}>*</span>
            <input
              name="brand"
              placeholder="HP, Dell, Lenovo"
              style={{ ...inputStyle, borderColor: errors.brand ? "#fca5a5" : "#d1d5db" }}
            />
            {errors.brand && <p style={errorStyle}>{errors.brand}</p>}
          </label>
          <label style={labelStyle}>
            Model <span style={{ color: "#2563eb" }}>*</span>
            <input
              name="model"
              placeholder="ProBook 450 G8"
              style={{ ...inputStyle, borderColor: errors.model ? "#fca5a5" : "#d1d5db" }}
            />
            {errors.model && <p style={errorStyle}>{errors.model}</p>}
          </label>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: "1px solid #f1f5f9", margin: "22px 0 20px" }} />

        {/* ── Section 3: Issue details ── */}
        <p style={sectionLabelStyle}>Issue details</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label style={labelStyle}>
            Issue category <span style={{ color: "#2563eb" }}>*</span>
            <select
              name="issueCategory"
              defaultValue={defaultValues.issueCategory}
              style={{ ...selectStyle, borderColor: errors.issueCategory ? "#fca5a5" : "#d1d5db" }}
            >
              <option value="">Select a category</option>
              {ISSUE_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {ISSUE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            {errors.issueCategory && <p style={errorStyle}>{errors.issueCategory}</p>}
          </label>
          <label style={labelStyle}>
            Describe the issue <span style={{ color: "#2563eb" }}>*</span>
            <textarea
              name="issueDescription"
              rows={4}
              placeholder="What's wrong? When did it start? Any error messages?"
              style={{
                ...inputStyle,
                height: "auto",
                padding: "10px 12px",
                resize: "vertical",
                lineHeight: 1.6,
                borderColor: errors.issueDescription ? "#fca5a5" : "#d1d5db",
              }}
            />
            {errors.issueDescription && <p style={errorStyle}>{errors.issueDescription}</p>}
          </label>
        </div>

        {/* ── Data notice ── */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 14px",
            backgroundColor: "#eff6ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }} aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ fontSize: "12px", color: "#1d4ed8", lineHeight: 1.6 }}>
            Back up your data before drop-off. The service desk is not responsible for data loss during repair.
          </p>
        </div>

        {/* ── Actions ── */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#64748b",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "7px",
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "40px",
              padding: "0 20px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#ffffff",
              backgroundColor: isPending ? "#93c5fd" : "#2563eb",
              border: "none",
              borderRadius: "7px",
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "background-color 150ms",
            }}
          >
            {isPending ? "Submitting…" : (
              <>
                Submit request
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
