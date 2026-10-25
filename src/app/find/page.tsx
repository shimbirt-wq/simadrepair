import { FindRequests } from "@/components/public/find-requests";
import { PublicLayout } from "@/components/public/public-layout";

export const metadata = { title: "Find my request", description: "Lost your tracking code? Find your repair requests with your university ID." };

export default function FindPage() {
  return (
    <PublicLayout width="form">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Find my request</h1>
        <p className="text-body text-ink-secondary">Lost your tracking code? We&apos;ll show your open requests.</p>
      </div>
      <FindRequests />
    </PublicLayout>
  );
}
