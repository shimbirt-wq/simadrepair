"use client";

import Link from "next/link";

import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";

type NavigationItem = {
  href: string;
  label: string;
};

type MobileMenuProps = {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
};

export function MobileMenu({ items, isOpen, onClose }: MobileMenuProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition duration-200 lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="Mobile navigation"
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-sm flex-col px-6 pb-6 pt-5 transition-transform duration-200 lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "#071020",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <SimadRepairLogo className="h-9 w-auto" variant="light" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition duration-200"
            style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
            aria-label="Close navigation menu"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
              <path
                d="m5 5 10 10M15 5 5 15"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="px-2 py-3 text-base font-semibold transition duration-200"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            href="/auth/login"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition duration-200"
            style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)" }}
          >
            Sign in
          </Link>
        </div>
      </aside>
    </>
  );
}
