import Link from "next/link";

function HeroIllustration() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 55% 55%, rgba(29,78,216,0.22) 0%, transparent 70%)",
          animation: "hero-glow 4s ease-in-out infinite",
        }}
      />

      <div className="relative w-full max-w-[560px]">
        {/* ── Floating card: Ticket submitted ── */}
        <div
          className="hero-float-a absolute -left-4 top-10 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 shadow-xl backdrop-blur-sm"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2Z" />
            </svg>
          </span>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>New request</p>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginTop: "1px" }}>SIM-2026-1042 submitted</p>
          </div>
        </div>

        {/* ── Floating card: Ready for pickup ── */}
        <div
          className="hero-float-b absolute -right-2 top-8 z-20 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
          style={{
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)",
            boxShadow: "0 8px 32px rgba(16,185,129,0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(52,211,153,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Status update</p>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginTop: "1px" }}>Ready for pickup</p>
          </div>
        </div>

        {/* ── Laptop SVG ── */}
        <svg
          viewBox="0 0 560 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full drop-shadow-2xl"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="laptopLid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1A2E4A" />
              <stop offset="100%" stopColor="#0D1B2E" />
            </linearGradient>
            <linearGradient id="screenGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="progressFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <clipPath id="screenClip">
              <rect x="74" y="32" width="412" height="248" rx="6" />
            </clipPath>
          </defs>

          {/* Laptop lid shadow */}
          <ellipse cx="280" cy="310" rx="220" ry="18" fill="#000" opacity="0.35" />

          {/* Laptop lid outer */}
          <rect x="56" y="18" width="448" height="270" rx="14" fill="url(#laptopLid)" stroke="#1E3A5F" strokeWidth="1.5" />

          {/* Camera dot */}
          <circle cx="280" cy="26" r="3" fill="#0D1B2E" stroke="#1E3A5F" strokeWidth="1" />

          {/* Screen area */}
          <rect x="74" y="32" width="412" height="248" rx="6" fill="#050D1B" />
          <rect x="74" y="32" width="412" height="248" rx="6" fill="url(#screenGlow)" />

          {/* Top nav bar */}
          <rect x="74" y="32" width="412" height="36" rx="6" fill="#0D1B2E" clipPath="url(#screenClip)" />
          <rect x="74" y="56" width="412" height="12" fill="#0D1B2E" />
          {/* Logo text placeholder */}
          <rect x="90" y="47" width="52" height="7" rx="3.5" fill="#1D4ED8" opacity="0.9" />
          {/* Nav dots */}
          <circle cx="462" cy="51" r="3" fill="#1E3A5F" />
          <circle cx="452" cy="51" r="3" fill="#1E3A5F" />
          <circle cx="472" cy="51" r="3" fill="#1E3A5F" />

          {/* Left sidebar */}
          <rect x="74" y="68" width="90" height="212" fill="#0A1628" clipPath="url(#screenClip)" />
          {/* Sidebar links */}
          <rect x="84" y="82" width="60" height="7" rx="3.5" fill="#1D4ED8" opacity="0.9" />
          <rect x="84" y="100" width="50" height="6" rx="3" fill="#4B6280" opacity="0.6" />
          <rect x="84" y="116" width="55" height="6" rx="3" fill="#4B6280" opacity="0.6" />
          <rect x="84" y="132" width="45" height="6" rx="3" fill="#4B6280" opacity="0.6" />
          <rect x="84" y="256" width="56" height="6" rx="3" fill="#4B6280" opacity="0.4" />

          {/* Main content area */}
          {/* Ticket card 1 — selected */}
          <rect x="172" y="76" width="192" height="100" rx="8" fill="#111E30" stroke="#1D4ED8" strokeWidth="1.2" />
          <rect x="184" y="88" width="100" height="7" rx="3.5" fill="#3B82F6" opacity="0.8" />
          <rect x="184" y="104" width="140" height="5" rx="2.5" fill="#94A3B8" opacity="0.5" />
          <rect x="184" y="118" width="80" height="5" rx="2.5" fill="#64748B" opacity="0.4" />
          {/* Status pill */}
          <rect x="184" y="134" width="68" height="20" rx="10" fill="#10B981" opacity="0.18" />
          <rect x="192" y="141" width="52" height="6" rx="3" fill="#10B981" opacity="0.85" />
          {/* Progress track */}
          <rect x="184" y="162" width="164" height="5" rx="2.5" fill="#1E293B" />
          <rect x="184" y="162" width="98" height="5" rx="2.5" fill="url(#progressFill)" />

          {/* Ticket card 2 */}
          <rect x="172" y="186" width="192" height="80" rx="8" fill="#0F1A2B" stroke="#1E3A5F" strokeWidth="1" />
          <rect x="184" y="198" width="80" height="6" rx="3" fill="#60A5FA" opacity="0.6" />
          <rect x="184" y="212" width="130" height="5" rx="2.5" fill="#64748B" opacity="0.4" />
          <rect x="184" y="226" width="58" height="18" rx="9" fill="#1D4ED8" opacity="0.18" />
          <rect x="192" y="233" width="42" height="5" rx="2.5" fill="#3B82F6" opacity="0.8" />

          {/* Right side detail panel */}
          <rect x="374" y="76" width="100" height="190" rx="8" fill="#0A1628" clipPath="url(#screenClip)" />
          <rect x="382" y="88" width="64" height="6" rx="3" fill="#64748B" opacity="0.5" />
          <rect x="382" y="104" width="80" height="7" rx="3.5" fill="#F1F5F9" opacity="0.5" />
          <rect x="382" y="120" width="55" height="5" rx="2.5" fill="#64748B" opacity="0.4" />

          <rect x="382" y="140" width="36" height="6" rx="3" fill="#64748B" opacity="0.4" />
          <rect x="382" y="154" width="80" height="6" rx="3" fill="#F1F5F9" opacity="0.45" />

          <rect x="382" y="176" width="40" height="6" rx="3" fill="#64748B" opacity="0.4" />
          <rect x="382" y="190" width="60" height="18" rx="9" fill="#10B981" opacity="0.18" />
          <rect x="390" y="197" width="44" height="5" rx="2.5" fill="#10B981" opacity="0.8" />

          <rect x="382" y="222" width="80" height="28" rx="6" fill="#1D4ED8" opacity="0.75" />
          <rect x="397" y="233" width="50" height="5" rx="2.5" fill="#fff" opacity="0.9" />

          {/* Keyboard base */}
          <rect x="36" y="292" width="488" height="44" rx="8" fill="#0F1B2D" stroke="#1A2E45" strokeWidth="1" />
          {/* Trackpad */}
          <rect x="216" y="300" width="128" height="26" rx="5" fill="none" stroke="#1E3A5F" strokeWidth="1" />
          {/* Key rows — simplified */}
          {[0,1,2,3].map((row) =>
            Array.from({ length: 12 }).map((_, col) => (
              <rect
                key={`key-${row}-${col}`}
                x={46 + col * 39}
                y={295 + row * 8}
                width={32}
                height={5}
                rx={1.5}
                fill="#1A2E45"
                opacity={0.6}
              />
            ))
          )}
        </svg>

        {/* ── Floating card: WhatsApp notification ── */}
        <div
          className="hero-float-c absolute -bottom-4 left-12 z-20 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(37,211,102,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(37,211,102,0.9)" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.872L0 24l6.293-1.519A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 0 1-4.983-1.361l-.357-.213-3.738.901.938-3.641-.234-.373A9.772 9.772 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
          </span>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Technician will reach out shortly</p>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section
      id="home"
      className="scroll-mt-20 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #06101E 0%, #050D1B 40%, #060F1D 100%)",
        paddingTop: "80px",
      }}
    >
      {/* Dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1380px] px-4 sm:px-8 lg:px-12">
        {/* Main two-column layout */}
        <div className="grid items-center gap-16 pb-12 pt-16 lg:grid-cols-2 lg:gap-8 lg:pb-0 lg:pt-24">

          {/* ── Left column: content ── */}
          <div className="flex flex-col">
            {/* Badge */}
            <div
              className="landing-animate inline-flex w-fit items-center gap-2 rounded-full px-4 py-2"
              style={{
                background: "rgba(29,78,216,0.18)",
                border: "1px solid rgba(96,165,250,0.3)",
                animationDelay: "0ms",
              }}
            >
              <span className="hero-pulse h-2 w-2 rounded-full" style={{ background: "#60A5FA" }} />
              <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60A5FA" }}>
                SIMAD University · IT Service Desk
              </span>
            </div>

            {/* Headline */}
            <h1
              className="landing-heading landing-animate mt-7"
              style={{
                fontSize: "clamp(44px, 6vw, 72px)",
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
                animationDelay: "80ms",
              }}
            >
              Smarter repairs.<br />
              <span style={{ color: "#60A5FA" }}>Faster pickup.</span>
            </h1>

            {/* Body */}
            <p
              className="landing-animate mt-6 max-w-[480px]"
              style={{
                fontSize: "18px",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.55)",
                animationDelay: "160ms",
              }}
            >
              Report your device issue, get it assigned to a skilled technician, and collect it when it&apos;s done — all tracked with a single code.
            </p>

            {/* CTAs */}
            <div className="landing-animate mt-10 flex flex-wrap gap-4" style={{ animationDelay: "240ms" }}>
              <Link
                href="/request-repair"
                className="inline-flex h-14 items-center gap-3 rounded-2xl px-7 text-[15px] font-bold text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                  boxShadow: "0 0 0 1px rgba(37,99,235,0.6), 0 16px 40px rgba(29,78,216,0.4)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Submit a Request
              </Link>
              <Link
                href="/track"
                className="inline-flex h-14 items-center gap-3 rounded-2xl px-7 text-[15px] font-bold transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                </svg>
                Track Your Request
              </Link>
            </div>

            {/* Stats row */}
            <div className="landing-animate mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-8" style={{ animationDelay: "320ms" }}>
              {[
                { value: "500+", label: "Repairs completed" },
                { value: "4", label: "Expert engineers" },
                { value: "Same day", label: "Response time" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="landing-heading" style={{ fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{value}</p>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontWeight: 500 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: illustration ── */}
          <div className="landing-animate hidden lg:block" style={{ animationDelay: "200ms" }}>
            <HeroIllustration />
          </div>
        </div>

        {/* Bottom wave fade into white */}
        <div
          className="pointer-events-none"
          style={{
            height: "80px",
            background: "linear-gradient(to bottom, transparent, #050D1B)",
            marginTop: "-20px",
          }}
        />
      </div>
    </section>
  );
}
