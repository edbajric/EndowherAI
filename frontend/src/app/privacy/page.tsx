import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { DisclaimerBlock } from "@/components/ui/DisclaimerBlock";
import { PrivacyStatement } from "@/components/ui/PrivacyStatement";

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy & consent"
      subtitle="Data use, anonymization, and ethics information. (Frontend-only placeholder)"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Consent" description="Personal tracking vs research contribution">
          <div className="grid gap-3 text-sm leading-7 text-ink">
            <p>You choose between personal tracking only and research contribution.</p>
            <p>Research contribution is opt-in and can be disabled anytime.</p>
            <p>Sensitive data fields are optional.</p>
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
