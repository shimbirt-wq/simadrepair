"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "./cn";

type ToastItem = { id: number; message: string; tone: "success" | "error" };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, tone }]);
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4000);
  }, []);

  const api: ToastApi = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={cn("pointer-events-auto flex items-center gap-2 rounded-md border bg-surface px-4 py-3 text-small font-medium shadow-lg", item.tone === "error" ? "border-error/30 text-error-text" : "border-line text-ink")}
            style={{ animation: "toast-in 200ms cubic-bezier(.22,1,.36,1)" }}
          >
            {item.tone === "error" ? <CircleAlert className="h-4 w-4" strokeWidth={1.75} /> : <CircleCheck className="h-4 w-4 text-success" strokeWidth={1.75} />}
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside ToastProvider");
  return api;
}
