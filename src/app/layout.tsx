import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarsamoTech Repair Hub",
  description: "Computer repair and maintenance management for SIMAD University.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
            const stored = window.localStorage.getItem("xeeltech-theme");
            const theme = stored === "dark" ? "dark" : "light";
            document.documentElement.dataset.theme = theme;
            document.documentElement.classList.toggle("dark", theme === "dark");
          })();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
