import Link from "next/link";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { PublicTracking } from "@/components/service-desk/public-tracking";

type TrackPageProps = {
  searchParams: Promise<{
    code?: string | string[];
  }>;
};

function getInitialCode(code: string | string[] | undefined) {
  if (Array.isArray(code)) {
    return code[0] ?? "";
  }

  return code ?? "";
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const initialCode = getInitialCode(params.code);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #06101E 0%, #050D1B 100%)" }}>
      {/* Dark sticky navbar — consistent with request-repair */}
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

          <nav
            style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto" }}
            className="hidden sm:flex"
          >
            <Link
              href="/request-repair"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.60)",
                textDecoration: "none",
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              Request Repair
            </Link>
            <Link
              href="/track"
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
              Track Repair
            </Link>
          </nav>

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

      {/* Hero strip */}
      <div
        style={{
          background: "linear-gradient(160deg, #06101E 0%, #050D1B 100%)",
          padding: "72px 24px 80px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#60A5FA",
            marginBottom: "16px",
          }}
        >
          Repair Tracking
        </p>
        <h1
          className="landing-heading"
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#ffffff",
            lineHeight: 1.08,
            marginBottom: "14px",
          }}
        >
          Check your repair status.
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
          }}
        >
          Enter the tracking code from your repair confirmation.
        </p>
      </div>

      {/* Tracking content */}
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        <PublicTracking initialCode={initialCode} />
      </div>
    </div>
  );
}
