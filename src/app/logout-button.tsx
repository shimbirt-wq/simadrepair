"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      title="Sign out"
      aria-label="Sign out"
      className="rounded-sm p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
