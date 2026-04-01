import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function AdminPage() {
  return (
    <PageShell
      title="Admin dashboard"
      subtitle="Protected route (frontend-only placeholder)."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Aggregated research" description="Cohort insights (placeholder)" />
        <Card title="Usage analytics" description="Engagement metrics (placeholder)" />
        <Card title="Exports" description="Download aggregate reports (placeholder)" />
      </div>
    </PageShell>
  );
}
