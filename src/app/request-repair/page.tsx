import Link from "next/link";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { PublicRepairRequestForm } from "@/components/service-desk/public-repair-request-form";

export default function RequestRepairPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f1f5f9" }}>

      {/* ── Sticky dark navbar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "#0f172a",
          height: "56px",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <SimadRepairLogo className="h-7 w-auto" variant="light" />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.30)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
              className="hidden sm:inline"
            >
              SIMAD UNIVERSITY · IT SERVICE DESK
            </span>
          </Link>

          {/* Nav links */}
          <nav
            style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto" }}
            className="hidden sm:flex"
          >
            <Link
              href="/request-repair"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#ffffff",
                textDecoration: "none",
                padding: "5px 12px",
                borderRadius: "6px",
                backgroundColor: "rgba(255,255,255,0.10)",
              }}
            >
              Request Repair
            </Link>
            <Link
              href="/track"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.60)",
                textDecoration: "none",
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              Track Repair
            </Link>
          </nav>

          {/* Staff sign-in */}
          <Link
            href="/auth/login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.75)",
              textDecoration: "none",
              padding: "5px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.18)",
              whiteSpace: "nowrap",
              marginLeft: "8px",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Staff Sign-In
          </Link>
        </div>
      </header>

      {/* ── Page body ── */}
      <main
        style={{
          flex: 1,
          padding: "40px 24px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "680px" }}>

          {/* Back link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#64748b",
              textDecoration: "none",
              marginBottom: "24px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to portal
          </Link>

          {/* Page heading */}
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              lineHeight: 1.2,
              marginBottom: "6px",
            }}
          >
            Request a repair
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px", lineHeight: 1.6 }}>
            Fields marked <span style={{ color: "#2563eb", fontWeight: 600 }}>*</span> are required.
            You&apos;ll receive a tracking code on submission.
          </p>

          {/* Form */}
          <PublicRepairRequestForm />
        </div>
      </main>
    </div>
  );
}
