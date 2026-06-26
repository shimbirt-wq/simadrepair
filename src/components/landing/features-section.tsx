export function LandingFeaturesSection() {
  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2Z" />
        </svg>
      ),
      title: "Submit in Seconds",
      body: "Describe the problem, choose your device type, and submit. No forms, no emails, no queuing at the door.",
      accent: "#3B82F6",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      ),
      title: "Live Repair Tracking",
      body: "Enter your tracking code anytime to see exactly where your device is — from receipt to ready for pickup.",
      accent: "#10B981",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: "Certified Engineers",
      body: "Every device is handled by SIMAD's trained technicians — hardware and software specialists who know what they're doing.",
      accent: "#F59E0B",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(37,211,102,0.9)" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.872L0 24l6.293-1.519A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 0 1-4.983-1.361l-.357-.213-3.738.901.938-3.641-.234-.373A9.772 9.772 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
        </svg>
      ),
      title: "WhatsApp Updates",
      body: "Get notified on WhatsApp the moment your repair status changes — no app download needed.",
      accent: "#25D366",
    },
  ];

  return (
    <section
      id="services"
      className="scroll-mt-20 relative"
      style={{ background: "#050D1B", paddingTop: "100px", paddingBottom: "100px" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(29,78,216,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1380px] px-4 sm:px-8 lg:px-12">
        {/* Label */}
        <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#3B82F6", marginBottom: "16px" }}>
          Built for students
        </p>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2
            className="landing-heading"
            style={{ fontSize: "clamp(34px, 4.5vw, 52px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: "#fff", maxWidth: "540px" }}
          >
            Everything you need,<br />nothing you don&apos;t.
          </h2>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", maxWidth: "380px" }}>
            Designed from day one for SIMAD students — simple, transparent, and actually useful.
          </p>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon, title, body, accent }) => (
            <div
              key={title}
              className="group relative flex flex-col gap-5 rounded-2xl p-6 transition-all duration-300"
              style={{
                background: `${accent}0D`,
                border: `1px solid ${accent}30`,
              }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${accent}18`, color: accent }}
              >
                {icon}
              </span>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>{title}</h3>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>{body}</p>
              </div>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ boxShadow: `0 0 0 1px ${accent}50, inset 0 0 40px ${accent}08` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
