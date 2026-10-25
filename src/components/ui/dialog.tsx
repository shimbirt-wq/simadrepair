"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "./cn";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "dialog" | "sheet";
};

/** Modal dialog (centred) or sheet (bottom on phones, right on desktop) built on <dialog>. */
export function Dialog({ open, onClose, title, children, footer, variant = "dialog" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-[92vh] w-[calc(100%-32px)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-n-950/40",
        variant === "dialog" ? "max-w-lg" : "mb-0 max-w-xl sm:mb-auto sm:mr-0 sm:h-full sm:max-h-full sm:rounded-none sm:rounded-l-2xl",
      )}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-h3">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-sm p-1 text-ink-muted hover:bg-muted hover:text-ink focus-visible:shadow-focus focus-visible:outline-none" aria-label="Close">
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer> : null}
      </div>
    </dialog>
  );
}
