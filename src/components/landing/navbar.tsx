"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { MobileMenu } from "@/components/landing/mobile-menu";

const navigationItems = [
  { href: "/#home", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#about-us", label: "About Us" }
] as const;

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-30 h-20"
        style={{
          background: "rgba(5, 13, 27, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="mx-auto grid h-full w-full max-w-[1680px] grid-cols-[1fr_auto] items-center px-4 sm:px-8 lg:grid-cols-[280px_1fr_280px] lg:px-12">
          <div className="flex min-w-0 justify-start lg:w-[280px] lg:justify-self-start">
            <SimadRepairLogo className="h-10 w-auto" variant="light" />
          </div>

          <nav className="hidden items-center justify-center gap-[44px] lg:flex lg:justify-self-center">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-[14px] lg:flex lg:w-[280px] lg:justify-self-end">
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center gap-3 rounded-[14px] px-5 text-[15px] font-semibold text-white transition duration-200"
              style={{
                background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                boxShadow: "0 0 0 1px rgba(37,99,235,0.5), 0 8px 20px rgba(29,78,216,0.3)",
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
                <path
                  d="M16.5 19.5v-1.2a3.3 3.3 0 0 0-3.3-3.3H8.8a3.3 3.3 0 0 0-3.3 3.3v1.2M11 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              Sign In
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl lg:hidden"
            style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff" }}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>
      </header>

      <MobileMenu items={[...navigationItems]} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
