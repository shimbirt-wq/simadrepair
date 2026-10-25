import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMADRepair IT Service Desk",
  description: "Computer repair and maintenance management for SIMAD University.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
