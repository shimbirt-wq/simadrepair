import { ClipboardList, Lock, PackageCheck, Search } from "lucide-react";

const checkpoints = [
  {
    label: "Intake",
    title: "Public form",
    detail: "Students and lecturers can submit without an internal account.",
    meta: "No portal required",
    icon: ClipboardList,
    accent: "text-[#1D4ED8]"
  },
  {
    label: "Lookup",
    title: "Tracking code",
    detail: "Requesters see safe progress details from their confirmation code.",
    meta: "Public-safe status",
    icon: Search,
    accent: "text-cyan-600"
  },
  {
    label: "Record",
    title: "Staff-only notes",
    detail: "Technician notes and requester contact records stay inside staff views.",
    meta: "Role protected",
    icon: Lock,
    accent: "text-amber-600"
  },
  {
    label: "Handoff",
    title: "Custody ready",
    detail: "Device receipt, storage, pickup readiness, and collection are tracked.",
    meta: "Pickup controlled",
    icon: PackageCheck,
    accent: "text-emerald-600"
  }
] as const;

export function LandingStatsStripSection() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] border-y border-slate-200">
        <div className="grid lg:grid-cols-4">
          {checkpoints.map((checkpoint) => {
            const Icon = checkpoint.icon;

            return (
              <article
                key={checkpoint.label}
                className="grid gap-4 border-b border-slate-200 py-6 last:border-b-0 sm:grid-cols-[44px_1fr] lg:border-b-0 lg:border-r lg:px-6 lg:last:border-r-0"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F8FAFC] ring-1 ring-slate-200">
                  <Icon className={`h-5 w-5 ${checkpoint.accent}`} strokeWidth={2.4} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{checkpoint.label}</p>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${checkpoint.accent}`}>{checkpoint.meta}</p>
                  </div>
                  <h3 className="mt-3 text-[24px] font-black leading-none tracking-[-0.03em] text-[#071225]">{checkpoint.title}</h3>
                  <p className="mt-3 text-[14px] font-medium leading-6 text-[#475569]">{checkpoint.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
