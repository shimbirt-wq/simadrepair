"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/landing/logo";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { ThemeToggle } from "@/components/landing/theme-toggle";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/devices", label: "Services" },
  { href: "/repair-tickets", label: "My Requests" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#about-us", label: "About Us" },
  { href: "/#support", label: "Support" }
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
      <header className="sticky top-0 z-30 h-20 border-b border-[#EAEFF3] bg-white transition-colors duration-300 dark:border-[#1E293B] dark:bg-[#0F172A]">
        <div className="mx-auto grid h-full w-full max-w-[1680px] grid-cols-[1fr_auto] items-center px-4 sm:px-8 lg:grid-cols-[280px_1fr_280px] lg:px-12">
          <div className="flex min-w-0 justify-start lg:w-[280px] lg:justify-self-start">
            <Logo />
          </div>

          <nav className="hidden items-center justify-center gap-[44px] lg:flex lg:justify-self-center">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[16px] font-semibold text-[#0F172A] transition-colors duration-200 hover:text-[#0F766E] dark:text-[#F8FAFC] dark:hover:text-[#5EEAD4]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-[14px] lg:flex lg:w-[280px] lg:justify-self-end">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center gap-3 rounded-[14px] border border-[#173B6B] bg-[#0F2D57] px-5 text-[15px] font-semibold text-white shadow-[0_10px_20px_rgba(15,45,87,0.18)] transition duration-200 hover:bg-[#13386b] dark:border-[#173B6B] dark:bg-[#0F2D57] dark:text-white dark:hover:bg-[#13386b]"
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
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F172A] transition duration-200 hover:text-[#0F766E] dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-[#F8FAFC] dark:hover:text-[#5EEAD4] lg:hidden"
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
