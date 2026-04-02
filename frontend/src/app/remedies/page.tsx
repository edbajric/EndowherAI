import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function RemediesPage() {
  return (
    <PageShell
      title="Remedies"
      subtitle="Log treatments used and perceived effectiveness."
    >
      <Card title="Remedy log" description="Time taken + effectiveness 0–10 + notes (placeholder)" />
    </PageShell>
  );
}
