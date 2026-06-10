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
      subtitle="Baseline health data, preferences, consent settings."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Consent settings" description="Choose what you want to share.">
          <ConsentToggle value={mode} onChange={setMode} />
        </Card>

        <Card title="Remedy statistics" description="Track which remedies are helping you most.">
          <div className="mt-3 space-y-3">
            <p className="text-sm text-inkMuted">
              See your full remedy history, effectiveness ratings, how long you've been using each remedy, and how you compare with the community.
            </p>
            <Button fullWidth href="/insights/remedies">
              View remedy stats →
            </Button>
          </div>
        </Card>

        <Card title="Privacy controls" description="Manage your account data.">
          <div className="grid gap-3 mt-3">
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
