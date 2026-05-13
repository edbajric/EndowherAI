"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider010 } from "@/components/forms/Slider010";

const REMEDY_CATEGORIES = [
  { value: "tea", label: "Tea / Herbal drink" },
  { value: "supplement", label: "Supplement" },
  { value: "exercise", label: "Exercise / Yoga" },
  { value: "heat", label: "Heat therapy" },
  { value: "meditation", label: "Meditation / Breathing" },
  { value: "diet", label: "Diet change" },
  { value: "medication", label: "Medication" },
  { value: "other", label: "Other" },
];

export default function RemediesPage() {
  const supabase = createClient();
  const [pseudonymId, setPseudonymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [remedyName, setRemedyName] = useState("");
  const [category, setCategory] = useState("other");
  const [effectiveness, setEffectiveness] = useState(5);
  const [duration, setDuration] = useState<number | "">("");
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
      .from("remedy_logs")
      .select("*")
      .eq("pseudonym_id", pid)
      .order("log_date", { ascending: false })
      .limit(10);

    if (data) setLogs(data);
  }

  async function handleSubmit() {
    if (!pseudonymId) return;

    if (!remedyName.trim()) {
      setError("Please enter a remedy name.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: insertError } = await supabase
      .from("remedy_logs")
      .insert({
        pseudonym_id: pseudonymId,
        remedy_name: remedyName.trim(),
        remedy_category: category,
        effectiveness,
        duration_minutes: duration === "" ? null : duration,
        notes: notes || null,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setRemedyName("");
    setCategory("other");
    setEffectiveness(5);
    setDuration("");
    setNotes("");
    loadLogs(pseudonymId);
  }

  return (
    <PageShell
      title="Remedies"
      subtitle="Log treatments and self-care strategies you've tried."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Remedy Logs */}
        <Card title="Recent remedies" description="Your last 10 entries.">
          {logs.length === 0 ? (
            <p className="text-sm text-inkMuted">No remedies logged yet. Start tracking what helps!</p>
          ) : (
            <div className="mt-2 space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-bgMuted/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-inkStrong">
                      {log.remedy_name}
                    </span>
                    <span className="text-xs text-inkMuted">
                      {log.effectiveness}/10 effective
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-inkMuted">
                    <span className="rounded-full bg-bgMuted px-2 py-0.5 capitalize">
                      {log.remedy_category}
                    </span>
                    <span>{log.log_date}</span>
                    {log.duration_minutes && (
                      <span>· {log.duration_minutes} min</span>
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

        {/* Remedy Form */}
        <Card title="Log a remedy" description="What did you try today?">
          <div className="mt-4 grid gap-4">
            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">
                Remedy name
              </label>
              <input
                type="text"
                value={remedyName}
                onChange={(e) => setRemedyName(e.target.value)}
                className="mt-3 h-11 w-full rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                placeholder="e.g., Chamomile tea, Yoga, Heat pad"
              />
            </div>

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-3 h-11 w-full rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
              >
                {REMEDY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <Slider010
              label="Effectiveness"
              description="0 = no help, 10 = very helpful"
              value={effectiveness}
              onChange={setEffectiveness}
            />

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">
                Duration (minutes) <span className="ml-2 text-xs text-inkMuted">Optional</span>
              </label>
              <input
                type="number"
                min="1"
                max="480"
                value={duration}
                onChange={(e) =>
                  setDuration(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="mt-3 h-11 w-full rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                placeholder="e.g., 30"
              />
            </div>

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">Notes</label>
              <p className="mt-1 text-xs leading-5 text-inkMuted">
                Any details about how it went. Avoid identifying info.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-3 min-h-20 w-full rounded-2xl bg-bg px-4 py-3 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                placeholder="Optional notes..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">Remedy logged!</p>
            )}

            <Button
              fullWidth
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Saving..." : "Log remedy"}
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
