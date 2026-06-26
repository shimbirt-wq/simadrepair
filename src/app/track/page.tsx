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
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f2" }}>
      {/* Simplified top navbar */}
      <header
        style={{
          borderBottom: "1px solid #e2e2dc",
          backgroundColor: "#ffffff",
          height: "60px",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" aria-label="SIMADRepair home">
            <SimadRepairLogo className="h-8 w-auto" />
          </Link>
          <Link href="/request-repair" className="btn-primary" style={{ fontSize: "13px" }}>
            Submit repair
          </Link>
        </div>
      </header>

      {/* Hero search strip */}
      <div
        style={{
          backgroundColor: "#0b1120",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "16px",
          }}
        >
          REPAIR TRACKING
        </p>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "#ffffff",
            lineHeight: 1.15,
            marginBottom: "12px",
          }}
        >
          Check your repair status.
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
          }}
        >
          Enter the tracking code from your repair request.
        </p>
      </div>

      {/* Tracking content */}
      <div
        className="page-container"
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 24px 60px",
        }}
      >
        <PublicTracking initialCode={initialCode} />
      </div>
    </div>
  );
}
