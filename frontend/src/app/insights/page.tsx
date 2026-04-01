import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function InsightsPage() {
  return (
    <PageShell
      title="Insights"
      subtitle="Graphs, personal trends, and your endo score."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Endo score" description="Composite severity signal (placeholder)" />
        <Card title="Trends" description="Pain vs cycle phase (placeholder)" />
        <Card title="Correlations" description="Triggers & remedies (placeholder)">
          <div className="mt-4 grid gap-2 text-sm">
            <Link className="text-inkStrong hover:underline" href="/insights/remedies">
              Remedy effectiveness
            </Link>
            <Link className="text-inkStrong hover:underline" href="/insights/data">
              Data-driven insights
            </Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
