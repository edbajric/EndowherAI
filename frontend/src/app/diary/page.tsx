"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Likert } from "@/components/forms/Likert";
import { SensitiveSection } from "@/components/forms/SensitiveSection";
import { Slider010 } from "@/components/forms/Slider010";

export default function DiaryPage() {
  const supabase = createClient();
  const [pseudonymId, setPseudonymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [pelvicPain, setPelvicPain] = useState(5);
  const [fatigue, setFatigue] = useState(4);
  const [stress, setStress] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [sexuallyActive, setSexuallyActive] = useState(false);
  const [painDuringSex, setPainDuringSex] = useState(0);
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
      .from("symptom_logs")
      .select("*")
      .eq("pseudonym_id", pid)
      .order("log_date", { ascending: false })
      .limit(7);

    if (data) setLogs(data);
  }

  async function handleSubmit() {
    if (!pseudonymId) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: insertError } = await supabase
      .from("symptom_logs")
      .insert({
        pseudonym_id: pseudonymId,
        log_date: new Date().toISOString().split("T")[0],
        pain_level: pelvicPain,
        mood: mood !== null ? String(mood) : null,
        fatigue_level: fatigue,
        notes: notes || null,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setNotes("");
    setPelvicPain(5);
    setFatigue(4);
    setStress(null);
    setMood(null);
    loadLogs(pseudonymId);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <PageShell
      title="Symptom diary"
      subtitle="Daily entry with optional sensitive fields."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Logs */}
        <Card title="Recent logs" description="Your last 7 entries.">
          {logs.length === 0 ? (
            <p className="text-sm text-inkMuted">No logs yet. Start tracking today!</p>
          ) : (
            <div className="mt-2 space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-bgMuted/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-inkStrong">
                      {log.log_date}
                    </span>
                    <span className="text-xs text-inkMuted">
                      Pain: {log.pain_level}/10
                    </span>
                  </div>
                  <div className="mt-1 flex gap-2 text-xs text-inkMuted">
                    {log.mood && <span>Mood: {log.mood}</span>}
                    {log.fatigue_level != null && (
                      <>
                        <span>·</span>
                        <span>Fatigue: {log.fatigue_level}/10</span>
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

        {/* Log Form */}
        <Card
          title="Today's entry"
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

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">Symptom logged successfully!</p>
            )}

            <Button
              fullWidth
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Saving..." : "Save entry"}
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
