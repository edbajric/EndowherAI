"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Likert } from "@/components/forms/Likert";
import { SensitiveSection } from "@/components/forms/SensitiveSection";
import { Slider010 } from "@/components/forms/Slider010";

export default function DiaryPage() {
  const [pelvicPain, setPelvicPain] = useState(5);
  const [fatigue, setFatigue] = useState(4);
  const [stress, setStress] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [sexuallyActive, setSexuallyActive] = useState(false);
  const [painDuringSex, setPainDuringSex] = useState(0);
  const [notes, setNotes] = useState("");

  return (
    <PageShell
      title="Symptom diary"
      subtitle="Daily entry with optional sensitive fields."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Calendar" description="Monthly overview (placeholder)" />

        <Card
          title="Today’s entry"
          description="Log your symptoms and notes."
        >
          <div className="mt-4 grid gap-4">
            <Slider010
              label="Pelvic pain"
              description="0 = none, 10 = worst"
              value={pelvicPain}
              onChange={setPelvicPain}
            />
            <Slider010
              label="Fatigue"
              value={fatigue}
              onChange={setFatigue}
            />

            <Likert
              label="Stress"
              description="How stressed did you feel today?"
              value={stress}
              onChange={setStress}
              optional
            />
            <Likert
              label="Mood"
              description="Overall mood intensity"
              value={mood}
              onChange={setMood}
              optional
            />

            <SensitiveSection title="Sexual health (optional)">
              <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
                <p className="text-sm font-medium text-inkStrong">Sexually active</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSexuallyActive(true)}
                    className={[
                      "h-11 rounded-full px-4 text-sm font-medium transition-colors",
                      sexuallyActive
                        ? "bg-accent text-inkStrong"
                        : "bg-bgMuted/60 text-inkStrong hover:bg-bgMuted",
                    ].join(" ")}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSexuallyActive(false)}
                    className={[
                      "h-11 rounded-full px-4 text-sm font-medium transition-colors",
                      !sexuallyActive
                        ? "bg-success text-inkStrong"
                        : "bg-bgMuted/60 text-inkStrong hover:bg-bgMuted",
                    ].join(" ")}
                  >
                    No
                  </button>
                </div>
              </div>

              <Slider010
                label="Pain during sex"
                value={painDuringSex}
                onChange={setPainDuringSex}
                optional
              />
            </SensitiveSection>

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">Notes</label>
              <p className="mt-1 text-xs leading-5 text-inkMuted">
                Avoid including real names or identifying details.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-3 min-h-28 w-full rounded-2xl bg-bg px-4 py-3 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                placeholder="Optional notes..."
              />
            </div>

            <Button
              fullWidth
              onClick={() => {
                console.log({
                  pelvicPain,
                  fatigue,
                  stress,
                  mood,
                  sexuallyActive,
                  painDuringSex,
                  notes,
                });
              }}
            >
              Save entry
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
