import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function EducationPage() {
  return (
    <PageShell
      title="Endometriosis education"
      subtitle="FAQ, evidence-based links, and educational articles."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="FAQ" description="Common questions (placeholder)" />
        <Card title="Evidence-based resources" description="Curated links (placeholder)" />
      </div>
    </PageShell>
  );
}
