import Link from "next/link";
import { Shield, Ticket, Users } from "lucide-react";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { LoginForm } from "@/app/auth/login/login-form";
import { getSafeNextPath } from "@/app/auth/login/redirects";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";

type LoginPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

const brandFeatures = [
  { icon: <Ticket size={16} />, text: "Manage repair tickets from intake to pickup" },
  { icon: <Users size={16} />, text: "Role-based access for admins, leads, and technicians" },
  { icon: <Shield size={16} />, text: "Device custody and chain-of-custody tracking" },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = getSafeNextPath(resolvedSearchParams?.next);
  const runtimeIssue = getAuthRuntimeIssue();

  return (
    <main style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Left brand panel ── */}
      <div
        style={{
          position: "relative",
          background: "linear-gradient(155deg, #071020 0%, #050D1B 50%, #071529 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 48px",
          width: "44%",
          flexShrink: 0,
          overflow: "hidden",
        }}
        className="hidden lg:flex"
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 80% 80% at 30% 60%, black 20%, transparent 100%)",
          }}
        />
        {/* Blue glow */}
        <div
          className="pointer-events-none absolute"
          style={{
            bottom: "-80px",
            left: "-80px",
            width: "480px",
            height: "480px",
            background: "radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <SimadRepairLogo className="h-9 w-auto" variant="light" />
        </div>

        <div className="relative">
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#60A5FA",
              marginBottom: 20,
            }}
          >
            IT Service Desk · Staff Portal
          </p>
          <h2
            className="landing-heading"
            style={{
              fontSize: 38,
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              marginBottom: 36,
            }}
          >
            Repair management<br />for SIMAD University.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {brandFeatures.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(96,165,250,0.15)",
                    color: "#60A5FA",
                  }}
                >
                  {f.icon}
                </span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative" style={{ display: "flex", gap: 20 }}>
          <Link
            href="/request-repair"
            style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
          >
            Submit a repair →
          </Link>
          <Link
            href="/track"
            style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
          >
            Track a repair →
          </Link>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          padding: "40px 32px",
        }}
      >
        {/* Mobile logo (hidden on desktop) */}
        <div className="mb-8 lg:hidden">
          <SimadRepairLogo className="h-9 w-auto" />
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            borderRadius: "20px",
            padding: "36px 36px 32px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.08)",
            border: "1px solid #E2E8F0",
          }}
        >
          <LoginForm nextPath={nextPath} />

          {runtimeIssue ? (
            <div
              style={{
                marginTop: 20,
                borderRadius: 10,
                border: "1px solid var(--fill-danger-soft-border)",
                background: "var(--danger-bg)",
                padding: "16px 20px",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--danger)" }}>
                Configuration required
              </p>
              <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "var(--red-800)" }}>{runtimeIssue}</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
