"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClasses } from "@/components/ui";

/** Errors inside a page. Kept free of server data so it always renders. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="flex max-w-md flex-col items-start gap-5">
        <h1 className="text-h1 text-ink">Something went wrong.</h1>
        <p className="text-body text-ink-secondary">Please try again. If it keeps happening, contact the IT service desk.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/track" className={buttonClasses("secondary", "md")}>
            Track a repair
          </Link>
          <Link href="/" className={buttonClasses("ghost", "md")}>
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
