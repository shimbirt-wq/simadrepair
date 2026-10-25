import Link from "next/link";
import type { ReactNode } from "react";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { ButtonLink, cn } from "@/components/ui";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/events/event-service";
import { whatsappDisplay } from "@/lib/phone";

/** Top bar + footer shared by every public page. */
export async function PublicLayout({ children, width = "content" }: { children: ReactNode; width?: "content" | "form" }) {
  const event = await getActiveEvent(prisma).catch(() => null);

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-content items-center gap-2 px-4 sm:px-6">
          <Link href="/" className="mr-auto flex items-center" aria-label="SIMADRepair home">
            <SimadRepairLogo className="h-8 w-auto" />
          </Link>
          <Link href="/track" className="hidden rounded-sm px-3 py-2 text-small font-medium text-ink-secondary hover:bg-muted hover:text-ink sm:inline-flex">
            Track repair
          </Link>
          <Link href="/auth/login" className="hidden rounded-sm px-3 py-2 text-small font-medium text-ink-muted hover:bg-muted hover:text-ink md:inline-flex">
            Staff sign-in
          </Link>
          <ButtonLink href="/request-repair" size="sm">
            Request repair
          </ButtonLink>
        </div>
      </header>

      <main className={cn("mx-auto w-full flex-1 px-4 py-10 sm:px-6 sm:py-14", width === "form" ? "max-w-form" : "max-w-content")}>{children}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-8 text-small text-ink-secondary sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">SIMAD University IT Service Desk</p>
            {event ? (
              <>
                <p>{event.venue} · {event.hours}</p>
                <p>
                  WhatsApp{" "}
                  <a className="font-mono text-ink-accent hover:underline" href={`https://wa.me/${event.deskWhatsapp.replace(/\D/g, "")}`}>
                    {whatsappDisplay(event.deskWhatsapp)}
                  </a>
                </p>
              </>
            ) : null}
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
            <Link href="/track" className="hover:text-ink">Track repair</Link>
            <Link href="/request-repair" className="hover:text-ink">Request repair</Link>
            <Link href="/auth/login" className="hover:text-ink">Staff sign-in</Link>
          </nav>
          <p className="text-caption text-ink-muted">© {new Date().getFullYear()} SIMAD University · Faculty of Computing</p>
        </div>
      </footer>
    </div>
  );
}
