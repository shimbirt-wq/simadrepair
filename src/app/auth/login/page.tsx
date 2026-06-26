import Link from "next/link";
import { Shield, Ticket, Users } from "lucide-react";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { LoginForm } from "@/app/auth/login/login-form";
import { getSafeNextPath } from "@/app/auth/login/redirects";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";
import { LOCAL_SEED_LOGIN_ACCOUNTS, LOCAL_SEED_PASSWORD } from "../../../../prisma/seed-helpers";

type LoginPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

const brandFeatures = [
  { icon: <Ticket size={16} />, text: "Manage repair tickets from intake to pickup" },
  { icon: <Users size={16} />, text: "Role-based access for admins, leads, and technicians" },
  { icon: <Shield size={16} />, text: "Device custody and chain-of-custody tracking" },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const showSeedHint = process.env.NODE_ENV !== "production";
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = getSafeNextPath(resolvedSearchParams?.next);
  const runtimeIssue = getAuthRuntimeIssue();

  return (
    <main style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Left brand panel ── */}
      <div
        style={{
          background: "#0b1120",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 48px",
          width: "42%",
          flexShrink: 0,
        }}
        className="hidden lg:flex"
      >
        <div>
          <SimadRepairLogo className="h-9 w-auto" variant="light" />
        </div>

        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: 16,
            }}
          >
            IT Service Desk
          </p>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            The repair management platform for SIMAD University.
          </h2>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
            {brandFeatures.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.60)" }}>
                <span style={{ color: "rgba(99,179,255,0.80)", flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 14 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <Link
            href="/request-repair"
            style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
          >
            Submit a repair request →
          </Link>
          <Link
            href="/track"
            style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
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
          background: "#ffffff",
          padding: "40px 32px",
        }}
      >
        {/* Mobile logo (hidden on desktop) */}
        <div className="mb-8 lg:hidden">
          <SimadRepairLogo className="h-9 w-auto" />
        </div>

        <div style={{ width: "100%", maxWidth: 400 }}>
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

          {showSeedHint ? (
            <div
              style={{
                marginTop: 20,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg-sunken)",
                padding: "16px 20px",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
                Dev seed accounts
              </p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {LOCAL_SEED_LOGIN_ACCOUNTS.map((account) => (
                  <div key={account.role} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{account.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{account.email}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: "var(--foreground)" }}>
                Password: <code style={{ fontFamily: "var(--font-mono)" }}>{LOCAL_SEED_PASSWORD}</code>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
