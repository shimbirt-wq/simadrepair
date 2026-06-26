const stats = [
  {
    value: "500+",
    label: "Repairs completed",
    sub: "Since our launch",
    color: "#3B82F6",
  },
  {
    value: "4",
    label: "Expert engineers",
    sub: "Hardware & software",
    color: "#10B981",
  },
  {
    value: "<2 hrs",
    label: "Average response",
    sub: "From submission to assignment",
    color: "#F59E0B",
  },
  {
    value: "100%",
    label: "Fully tracked",
    sub: "Every device, every step",
    color: "#8B5CF6",
  },
] as const;

export function LandingStatsStripSection() {
  return (
    <section
      style={{ background: "#050D1B", paddingTop: "80px", paddingBottom: "80px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
          {stats.map(({ value, label, sub, color }) => (
            <div key={label} className="flex flex-col">
              <span
                className="landing-heading"
                style={{ fontSize: "clamp(44px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-0.05em", color, lineHeight: 1, marginBottom: "12px" }}
              >
                {value}
              </span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{label}</span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
