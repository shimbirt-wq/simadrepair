import { ButtonLink } from "@/components/ui";
import { PublicLayout } from "@/components/public/public-layout";

export default function NotFound() {
  return (
    <PublicLayout width="form">
      <div className="flex flex-col items-start gap-5 py-10">
        <p className="font-mono text-small text-ink-muted">404</p>
        <h1 className="text-h1 text-ink">This page doesn&apos;t exist.</h1>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/request-repair">Request repair</ButtonLink>
          <ButtonLink href="/track" variant="secondary">
            Track a repair
          </ButtonLink>
        </div>
      </div>
    </PublicLayout>
  );
}
