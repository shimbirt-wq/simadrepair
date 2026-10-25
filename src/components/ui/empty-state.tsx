import type { ReactNode } from "react";

export function EmptyState({ icon, title, action }: { icon?: ReactNode; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
      {icon ? <span className="text-ink-muted">{icon}</span> : null}
      <p className="text-small text-ink-secondary">{title}</p>
      {action}
    </div>
  );
}
