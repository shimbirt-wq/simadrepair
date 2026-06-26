const stats = [
  {
    value: "4",
    label: "Engineers on your team",
    sub: "Dedicated SIMAD IT staff",
  },
  {
    value: "Free",
    label: "For every SIMAD student",
    sub: "No hidden fees, ever",
  },
  {
    value: "5 stages",
    label: "Fully tracked pipeline",
    sub: "From intake to collection",
  },
  {
    value: "Online",
    label: "Submit from anywhere",
    sub: "No walk-in required",
  },
] as const;

export function LandingStatsStripSection() {
  return (
    <section
      style={{
        background: "#050D1B",
        paddingTop: "72px",
        paddingBottom: "72px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="flex flex-col">
              <span
                className="landing-heading"
                style={{
                  fontSize: "clamp(38px, 4.5vw, 56px)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "#ffffff",
                  lineHeight: 1,
                  marginBottom: "14px",
                }}
              >
                {value}
              </span>
              <div className="mb-2 h-[2px] w-8" style={{ background: "#3B82F6" }} />
              <span style={{ fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: "4px" }}>
                {label}
              </span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                {sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
