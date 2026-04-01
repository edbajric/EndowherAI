import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ConsentWithdrawalPage() {
  return (
    <PageShell
      title="Consent withdrawal"
      subtitle="Disable research contribution and request data removal. (Frontend-only placeholder)"
    >
      <Card title="Withdraw consent" description="Frontend-only action">
        <div className="grid gap-3 text-sm leading-7 text-ink">
          <p>
            If you previously opted into research contribution, you can withdraw at
            any time.
          </p>
          <Button>Withdraw research consent</Button>
        </div>
      </Card>
    </PageShell>
  );
}
