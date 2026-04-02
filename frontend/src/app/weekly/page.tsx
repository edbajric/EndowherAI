"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Likert } from "@/components/forms/Likert";
import { SensitiveSection } from "@/components/forms/SensitiveSection";
import { Slider010 } from "@/components/forms/Slider010";

export default function WeeklyPage() {
  const [avgPain, setAvgPain] = useState(4);
  const [bloating, setBloating] = useState(3);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [anxiety, setAnxiety] = useState<number | null>(null);
  const [bowelSymptoms, setBowelSymptoms] = useState(0);
  const [urinarySymptoms, setUrinarySymptoms] = useState(0);
  const [notes, setNotes] = useState("");

  return (
    <PageShell
      title="Weekly check-in"
      subtitle="A quick summary entry."
    >
      <div className="grid gap-4">
        <Slider010
          label="Average pelvic pain (past 7 days)"
          value={avgPain}
          onChange={setAvgPain}
        />
        <Slider010
          label="Bloating (endo belly)"
          value={bloating}
          onChange={setBloating}
        />

        <Likert
          label="Sleep quality"
          description="How would you rate your sleep overall this week?"
          value={sleepQuality}
          onChange={setSleepQuality}
          optional
        />
        <Likert
          label="Anxiety"
          description="How intense was anxiety this week?"
          value={anxiety}
          onChange={setAnxiety}
          optional
        />

        <SensitiveSection title="Digestive / urinary (optional)">
          <Slider010
            label="Bowel symptoms"
            description="Constipation, nausea, pain, etc."
            value={bowelSymptoms}
            onChange={setBowelSymptoms}
            optional
          />
          <Slider010
            label="Urinary symptoms"
            description="Pain with urination, urgency, etc."
            value={urinarySymptoms}
            onChange={setUrinarySymptoms}
            optional
          />
        </SensitiveSection>

        <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
          <label className="text-sm font-medium text-inkStrong">Notes</label>
          <p className="mt-1 text-xs leading-5 text-inkMuted">
            Optional weekly notes. Avoid identifying details.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-3 min-h-28 w-full rounded-2xl bg-bg px-4 py-3 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
            placeholder="Optional notes..."
          />
        </div>

        <Button
          onClick={() =>
            console.log({
              avgPain,
              bloating,
              sleepQuality,
              anxiety,
              bowelSymptoms,
              urinarySymptoms,
              notes,
            })
          }
        >
          Save weekly check-in
        </Button>
      </div>
    </PageShell>
  );
}
