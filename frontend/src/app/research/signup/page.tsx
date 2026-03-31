import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DisclaimerBlock } from "@/components/ui/DisclaimerBlock";
import { PrivacyStatement } from "@/components/ui/PrivacyStatement";

export default function ResearchSignupPage() {
  return (
    <PageShell
      title="Join research tracking"
      subtitle="Consent explanation, inclusion criteria, weekly questionnaires. (Frontend-only placeholder)"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Consent" description="Opt-in only. You can withdraw anytime.">
          <div className="grid gap-3 text-sm leading-7 text-ink">
            <p>
              If you opt in, your data is used only in anonymized, aggregated form
              for research-style pattern discovery.
            </p>
            <Button fullWidth href="/signup">
              Continue to signup
            </Button>
          </div>
        </Card>
        <div className="grid gap-4">
          <PrivacyStatement />
          <DisclaimerBlock />
        </div>
      </div>
    </PageShell>
  );
}
