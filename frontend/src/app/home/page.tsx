import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomeAfterLoginPage() {
  return (
    <PageShell
      title="Home"
      subtitle="Quick overview, today’s status, and shortcuts. (Frontend-only placeholder)"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Today" description="Quick check-in">
          <div className="grid gap-3">
            <p className="text-sm text-ink">Pelvic pain: 6/10</p>
            <Button fullWidth href="/diary">
              Log symptoms
            </Button>
          </div>
        </Card>

        <Card title="Insights" description="Your trends and endo score">
          <Button fullWidth variant="secondary" href="/insights">
            See insights
          </Button>
        </Card>

        <Card title="Remedies" description="Track what you tried">
          <Button fullWidth variant="secondary" href="/remedies">
            Add remedy
          </Button>
        </Card>
      </div>
    </PageShell>
  );
}
