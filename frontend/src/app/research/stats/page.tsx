import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function ResearchStatsPage() {
  return (
    <PageShell
      title="Research statistics"
      subtitle="Anonymized cohort data and aggregated statistics."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Cohort overview" description="Counts, averages, distributions (placeholder)" />
        <Card title="Patterns" description="Aggregated symptom/cycle trends (placeholder)" />
      </div>
    </PageShell>
  );
}
