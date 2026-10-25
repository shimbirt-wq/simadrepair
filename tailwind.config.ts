import type { Config } from "tailwindcss";

const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((step) => [step, `var(--${name}-${step})`]));

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        n: scale("n", [0, 25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        green: scale("green", [50, 100, 200, 300, 400, 500, 600, 700, 900]),
        app: "var(--bg-app)",
        muted: "var(--bg-muted)",
        surface: "var(--surface)",
        inverse: "var(--bg-inverse)",
        line: { DEFAULT: "var(--border-default)", strong: "var(--border-strong)" },
        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
          accent: "var(--text-accent)",
        },
        accent: { DEFAULT: "var(--accent)", hover: "var(--accent-hover)", soft: "var(--accent-soft)" },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)", text: "var(--success-text)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)", text: "var(--warning-text)" },
        error: { DEFAULT: "var(--error)", soft: "var(--error-soft)", text: "var(--error-text)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)", text: "var(--info-text)" },
        neutral: { soft: "var(--neutral-soft)", text: "var(--neutral-text)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        display: ["44px", { lineHeight: "1.08", fontWeight: "800", letterSpacing: "-0.02em" }],
        h1: ["30px", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.01em" }],
        h2: ["22px", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["17px", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.55" }],
        small: ["13.5px", { lineHeight: "1.5" }],
        caption: ["12.5px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      borderRadius: {
        xs: "var(--r-xs)",
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        "2xl": "var(--r-2xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--glow-accent)",
        focus: "var(--focus-ring)",
      },
      transitionTimingFunction: { brand: "cubic-bezier(0.22, 1, 0.36, 1)" },
      transitionDuration: { fast: "120ms", base: "200ms", slow: "360ms" },
      maxWidth: { content: "1200px", form: "680px", ops: "1440px" },
    },
  },
  plugins: [],
};

export default config;
