import { PublicLayout } from "@/components/public/public-layout";
import { TrackingView } from "@/components/public/tracking-view";

export const metadata = { title: "Track your repair · SIMADRepair" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  return (
    <PublicLayout width="form">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Track your repair</h1>
      </div>
      <TrackingView initialCode={code} />
    </PublicLayout>
  );
}
