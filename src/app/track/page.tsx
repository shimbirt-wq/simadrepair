import Link from "next/link";
import { PublicLayout } from "@/components/public/public-layout";
import { TrackingView } from "@/components/public/tracking-view";

export const metadata = { title: "Track your repair", description: "Check the status of your repair with your tracking code." };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  return (
    <PublicLayout width="form">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Track your repair</h1>
        <p className="text-body text-ink-secondary">
          Lost your code?{" "}
          <Link href="/find" className="font-medium text-ink-accent hover:underline">
            Find my request
          </Link>
        </p>
      </div>
      <TrackingView initialCode={code} />
    </PublicLayout>
  );
}
