const steps = [
  {
    n: "01",
    title: "Describe the issue",
    body: "Fill out a quick form — tell us what's wrong, your device type, and how to reach you.",
    color: "#3B82F6",
  },
  {
    n: "02",
    title: "We assign it",
    body: "A technician is assigned to your case and your device is logged into our custody system.",
    color: "#8B5CF6",
  },
  {
    n: "03",
    title: "We fix it",
    body: "Your device is diagnosed and repaired. You can check live status anytime with your tracking code.",
    color: "#F59E0B",
  },
  {
    n: "04",
    title: "Collect and go",
    body: "We notify you when it's ready. Pick it up from the IT desk — fully repaired, tested, and yours again.",
    color: "#10B981",
  },
] as const;

export function LandingHowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 relative"
      style={{ background: "#F8FAFC", paddingTop: "100px", paddingBottom: "100px" }}
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1D4ED8", marginBottom: "16px" }}>
              How it works
            </p>
            <h2
              className="landing-heading"
              style={{ fontSize: "clamp(34px, 4.5vw, 52px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: "#0F172A", maxWidth: "520px" }}
            >
              Four steps.<br />Zero confusion.
            </h2>
          </div>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#64748B", maxWidth: "360px" }}>
            From the moment you submit to the moment you walk out — every step is transparent and tracked.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, title, body, color }, i) => (
            <div key={n} className="relative flex flex-col">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div
                  className="pointer-events-none absolute left-[calc(100%+12px)] top-6 hidden w-[24px] border-t-2 border-dashed lg:block"
                  style={{ borderColor: `${color}40` }}
                />
              )}

              {/* Step number */}
              <div
                className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${color}15`, border: `1.5px solid ${color}30` }}
              >
                <span className="landing-heading" style={{ fontSize: "15px", fontWeight: 800, color, letterSpacing: "-0.02em" }}>{n}</span>
              </div>

              <h3 style={{ fontSize: "19px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: "10px" }}>
                {title}
              </h3>
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#64748B" }}>
                {body}
              </p>

              {/* Bottom accent */}
              <div className="mt-6 h-[3px] w-12 rounded-full" style={{ background: color }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
