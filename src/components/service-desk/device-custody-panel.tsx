"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CUSTODY_STATUS_LABELS } from "@/lib/service-desk/constants";
import { CustodyStatusForm } from "@/components/service-desk/custody-status-form";
import { DeviceCheckInForm } from "@/components/service-desk/device-check-in-form";
import { PickupConfirmationForm } from "@/components/service-desk/pickup-confirmation-form";

export type CustodyDetailData = {
  ticket: {
    id: string;
    ticketId: string;
    trackingCode: string | null;
    status: string;
    severity: string | null;
    repairMethod: string | null;
    issueCategory: string | null;
    createdAt: string;
  };
  requester: {
    fullName: string | null;
    requesterType: string | null;
    universityId: string | null;
    faculty: string | null;
    department: string | null;
    phone: string | null;
    email: string | null;
  };
  device: {
    id: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
    assetTag: string | null;
    description: string | null;
  };
  custody: {
    id: string;
    status: string;
    receivedAt: string | null;
    condition: string | null;
    screenCondition: string | null;
    keyboardCondition: string | null;
    batteryCondition: string | null;
    bodyCondition: string | null;
    accessories: unknown;
    storageLocation: string | null;
    checkInPhotoUrls: unknown;
    releasedById: string | null;
    readyForCollectionAt: string | null;
    collectedByName: string | null;
    collectedByPhone: string | null;
    collectedAt: string | null;
    pickupCodeVerifiedAt: string | null;
    receivedBy: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
    releasedBy: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
  } | null;
};

type CustodyResponse = {
  error?: string;
  custody?: CustodyDetailData;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCustody(value: string | null) {
  if (!value) {
    return "Not checked in";
  }

  return CUSTODY_STATUS_LABELS[value as keyof typeof CUSTODY_STATUS_LABELS] ?? value.replaceAll("_", " ");
}

function formatAccessories(value: unknown) {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.length > 0 ? value.join(", ") : "None recorded";
  }

  return "Not recorded";
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function CustodySummary({ custodyDetail }: { custodyDetail: CustodyDetailData }) {
  const custody = custodyDetail.custody;

  if (!custody) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">No custody record exists yet.</p>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Check in the device when it is physically received so responsibility, condition, accessories, and storage are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <DetailItem label="Custody status" value={formatCustody(custody.status)} />
      <DetailItem label="Storage location" value={custody.storageLocation ?? "Not set"} />
      <DetailItem label="Received at" value={formatDate(custody.receivedAt)} />
      <DetailItem label="Received by" value={custody.receivedBy?.fullName ?? "Not set"} />
      <DetailItem label="Condition" value={custody.condition ?? "Not set"} />
      <DetailItem label="Screen" value={custody.screenCondition ?? "Not set"} />
      <DetailItem label="Keyboard" value={custody.keyboardCondition ?? "Not set"} />
      <DetailItem label="Battery" value={custody.batteryCondition ?? "Not set"} />
      <DetailItem label="Body" value={custody.bodyCondition ?? "Not set"} />
      <DetailItem label="Accessories" value={formatAccessories(custody.accessories)} />
      <DetailItem label="Ready for collection" value={formatDate(custody.readyForCollectionAt)} />
      <DetailItem label="Collected by" value={custody.collectedByName ?? "Not collected"} />
      <DetailItem label="Collected at" value={formatDate(custody.collectedAt)} />
      <DetailItem label="Released by" value={custody.releasedBy?.fullName ?? "Not released"} />
    </div>
  );
}

export function DeviceCustodyPanel({
  onCustodyChanged,
  ticketId,
}: {
  onCustodyChanged: () => void | Promise<void>;
  ticketId: string;
}) {
  const [custodyDetail, setCustodyDetail] = useState<CustodyDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadCustody = useCallback(() => {
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(ticketId)}/custody`, { method: "GET" });
      const body = (await response.json().catch(() => null)) as CustodyResponse | null;

      if (!response.ok || !body?.custody) {
        setCustodyDetail(null);
        setError(body?.error ?? "Unable to load custody details.");
        return;
      }

      setCustodyDetail(body.custody);
    });
  }, [ticketId]);

  async function handleCustodyUpdated(updatedCustody: CustodyDetailData) {
    setCustodyDetail(updatedCustody);
    await onCustodyChanged();
    loadCustody();
  }

  useEffect(() => {
    setCustodyDetail(null);
    loadCustody();
  }, [loadCustody, ticketId]);

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Device custody</p>
          <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Physical accountability</h3>
        </div>
        <button type="button" onClick={loadCustody} className="btn-secondary">
          Refresh
        </button>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Custody tracks where the physical device is and who handled it. Repair progress remains separate.
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-4 text-sm font-medium text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="mt-5">
        {custodyDetail ? (
          <CustodySummary custodyDetail={custodyDetail} />
        ) : (
          <p className="text-sm text-[var(--muted)]">{isPending ? "Loading custody details..." : "No custody details loaded."}</p>
        )}
      </div>

      {custodyDetail ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {!custodyDetail.custody ? (
            <DeviceCheckInForm custodyDetail={custodyDetail} onCustodyUpdated={handleCustodyUpdated} />
          ) : null}
          {custodyDetail.custody ? (
            <CustodyStatusForm custodyDetail={custodyDetail} onCustodyUpdated={handleCustodyUpdated} />
          ) : null}
          {custodyDetail.custody?.status === "READY_FOR_COLLECTION" ? (
            <PickupConfirmationForm custodyDetail={custodyDetail} onCustodyUpdated={handleCustodyUpdated} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
