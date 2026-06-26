import Link from "next/link";

export function LandingCtaBanner() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #050D1B 0%, #071529 60%, #050D1B 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "100px",
        paddingBottom: "100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "700px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(29,78,216,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[900px] px-4 sm:px-8 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8"
          style={{
            background: "rgba(29,78,216,0.18)",
            border: "1px solid rgba(96,165,250,0.3)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60A5FA" }}>
            Free for all SIMAD students
          </span>
        </div>

        <h2
          className="landing-heading"
          style={{
            fontSize: "clamp(40px, 6vw, 68px)",
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: "#fff",
            marginBottom: "24px",
          }}
        >
          Got a broken device?<br />
          <span style={{ color: "#60A5FA" }}>Let&apos;s fix it.</span>
        </h2>

        <p
          style={{
            fontSize: "18px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.5)",
            maxWidth: "540px",
            margin: "0 auto 48px",
          }}
        >
          Submit your repair request in under two minutes. Our team will take it from there.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/request-repair"
            className="inline-flex h-14 items-center gap-3 rounded-2xl px-8 text-[15px] font-bold text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
              boxShadow: "0 0 0 1px rgba(37,99,235,0.6), 0 16px 40px rgba(29,78,216,0.45)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Submit a Request
          </Link>
          <Link
            href="/track"
            className="inline-flex h-14 items-center gap-3 rounded-2xl px-8 text-[15px] font-bold transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Track an existing repair
          </Link>
        </div>
      </div>
    </section>
  );
}
