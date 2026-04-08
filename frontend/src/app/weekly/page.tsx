"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Likert } from "@/components/forms/Likert";
import { SensitiveSection } from "@/components/forms/SensitiveSection";
import { Slider010 } from "@/components/forms/Slider010";

export default function WeeklyPage() {
  const supabase = createClient();
  const [pseudonymId, setPseudonymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [avgPain, setAvgPain] = useState(4);
  const [bloating, setBloating] = useState(3);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [anxiety, setAnxiety] = useState<number | null>(null);
  const [bowelSymptoms, setBowelSymptoms] = useState(0);
  const [urinarySymptoms, setUrinarySymptoms] = useState(0);
  const [notes, setNotes] = useState("");

  // Recent logs
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("pseudonym_id")
        .eq("auth_id", user.id)
        .single();

      if (profile) {
        setPseudonymId(profile.pseudonym_id);
        loadLogs(profile.pseudonym_id);
      }
    }

    loadProfile();
  }, []);

  async function loadLogs(pid: string) {
    const { data } = await supabase
      .from("weekly_logs")
      .select("*")
      .eq("pseudonym_id", pid)
      .order("week_start", { ascending: false })
      .limit(4);

    if (data) setLogs(data);
  }

  async function handleSubmit() {
    if (!pseudonymId) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: insertError } = await supabase
      .from("weekly_logs")
      .insert({
        pseudonym_id: pseudonymId,
        avg_pain: avgPain,
        bloating,
        sleep_quality: sleepQuality,
        anxiety,
        bowel_symptoms: bowelSymptoms,
        urinary_symptoms: urinarySymptoms,
        notes: notes || null,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setAvgPain(4);
    setBloating(3);
    setSleepQuality(null);
    setAnxiety(null);
    setBowelSymptoms(0);
    setUrinarySymptoms(0);
    setNotes("");
    loadLogs(pseudonymId);
  }

  return (
    <PageShell
      title="Weekly check-in"
      subtitle="A quick summary of your week."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Weekly Logs */}
        <Card title="Past check-ins" description="Your last 4 weeks.">
          {logs.length === 0 ? (
            <p className="text-sm text-inkMuted">No weekly logs yet.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-bgMuted/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-inkStrong">
                      Week of {log.week_start}
                    </span>
                    <span className="text-xs text-inkMuted">
                      Pain: {log.avg_pain}/10
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-inkMuted">
                    <span>Bloating: {log.bloating}/10</span>
                    {log.sleep_quality != null && (
                      <>
                        <span>·</span>
                        <span>Sleep: {log.sleep_quality}/4</span>
                      </>
                    )}
                    {log.anxiety != null && (
                      <>
                        <span>·</span>
                        <span>Anxiety: {log.anxiety}/4</span>
                      </>
                    )}
                  </div>
                  {log.notes && (
                    <p className="mt-1 text-xs text-inkMuted">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Weekly Form */}
        <Card title="This week" description="How was your week overall?">
          <div className="mt-4 grid gap-4">
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

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">Weekly check-in saved!</p>
            )}

            <Button
              fullWidth
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Saving..." : "Save weekly check-in"}
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
