"use client";

import Link from "next/link";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="SIMADRepair home"
      className="group inline-flex items-center gap-3 transition-colors duration-200"
    >
      <span className="flex h-12 w-12 items-center justify-center text-[#1D4ED8] transition-transform duration-200 group-hover:scale-105">
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-12 w-12">
          <path
            d="M32 4.5 50 14.9v20.7L32 46 14 35.6V14.9L32 4.5Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="3.2"
          />
          <path
            d="M32 4.5v41.5M14 14.9 32 25.3l18-10.4M14 35.6 32 25.3l18 10.3"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.2"
          />
          <circle cx="32" cy="25.4" r="3" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={`${compact ? "hidden sm:flex" : "flex"} flex-col leading-none`}>
        <span className="text-[23px] font-extrabold tracking-[-0.04em]">
          <span className="text-[#0F172A] dark:text-white">SIMAD</span>
          <span className="text-[#1D4ED8]">Repair</span>
        </span>
        <span className="mt-1 text-[11px] font-medium tracking-[0.01em] text-[#1D4ED8]/75">
          IT Service Desk
        </span>
      </span>
    </Link>
  );
}
