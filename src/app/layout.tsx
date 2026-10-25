import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "SIMADRepair · SIMAD University IT Service Desk", template: "%s · SIMADRepair" },
  description: "Free computer repair and maintenance for SIMAD University students and staff during the Computer Maintenance Program.",
  applicationName: "SIMADRepair",
  openGraph: { type: "website", siteName: "SIMADRepair", locale: "en" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
