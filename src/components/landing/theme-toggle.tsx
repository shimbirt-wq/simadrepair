"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "xeeltech-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: Theme = storedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={theme === "dark"}
      className="relative inline-flex h-14 w-14 items-center justify-center rounded-[16px] border border-[#D9F1EC] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-[#BFE8DE] hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] dark:border-[#1E293B] dark:bg-[#111827]"
    >
      <span
        className={`absolute inset-0 rounded-[16px] bg-[radial-gradient(circle_at_center,_rgba(13,148,136,0.08),_transparent_65%)] transition-opacity duration-300 ${
          theme === "light" ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="relative flex items-center justify-center text-slate-400 dark:text-slate-500">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`absolute h-5 w-5 text-[#1D4ED8] transition-all duration-300 ${
            theme === "light" ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          <path
            d="M10 3.2V1.5m0 17v-1.7M5.19 5.19 3.98 3.98m12.04 12.04-1.21-1.21M3.2 10H1.5m17 0h-1.7M5.19 14.81l-1.21 1.21m12.04-12.04-1.21 1.21M13.2 10A3.2 3.2 0 1 1 6.8 10a3.2 3.2 0 0 1 6.4 0Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </svg>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`absolute h-5 w-5 text-[#0F172A] transition-all duration-300 dark:text-[#F8FAFC] ${
            theme === "dark" ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          <path d="M15.4 12.6A6.9 6.9 0 0 1 7.4 4.6a7.2 7.2 0 1 0 8 8Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
