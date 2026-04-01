"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { ConsentToggle } from "@/components/ui/ConsentToggle";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const [mode, setMode] = useState<"personal" | "research">("personal");

  return (
    <PageShell
      title="Profile"
      subtitle="Baseline health data, preferences, consent settings. (Frontend-only placeholder)"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Consent settings" description="Choose what you want to share.">
          <ConsentToggle value={mode} onChange={setMode} />
        </Card>

        <Card title="Privacy controls" description="Frontend-only buttons">
          <div className="grid gap-3">
            <Button fullWidth variant="secondary">
              Regenerate random user ID
            </Button>
            <Button fullWidth>
              Delete account + delete all data
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
