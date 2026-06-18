"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Likert } from "@/components/forms/Likert";
import { SensitiveSection } from "@/components/forms/SensitiveSection";
import { Slider010 } from "@/components/forms/Slider010";
import { useActiveRemedies, getQuickAmounts, type ActiveRemedy } from "@/lib/active-remedies";
import { useCycles, findActiveCycle, getDayStatus, toDateKey } from "@/lib/cycles";

// ─── Per-remedy quick-log state ───────────────────────────────────────────────

interface RemedyEntry {
  quantity:      number | "";
  effectiveness: number;   // 2 = didn't help, 5 = OK, 8 = really helped
  logged:        boolean;
  logging:       boolean;
}

const EFFECTIVENESS_OPTS = [
  { value: 2, label: "👎", title: "Didn't help" },
  { value: 5, label: "😐", title: "OK" },
  { value: 8, label: "👍", title: "Really helped" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiaryPage() {
  const supabase = createClient();
  const [pseudonymId, setPseudonymId] = useState<string | null>(null);

  // Diary form
  const [loading,           setLoading]           = useState(false);
  const [success,           setSuccess]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [pelvicPain,        setPelvicPain]        = useState(5);
  const [fatigue,           setFatigue]           = useState(4);
  const [bleedingIntensity, setBleedingIntensity] = useState("none");
  const [stress,            setStress]            = useState<number | null>(null);
  const [mood,              setMood]              = useState("neutral");
  const [sexuallyActive,    setSexuallyActive]    = useState(false);
  const [painDuringSex,     setPainDuringSex]     = useState(0);
  const [notes,             setNotes]             = useState("");

  // Recent logs
  const [logs, setLogs] = useState<any[]>([]);

  // Active remedies (Supabase-backed)
  const { remedies, loading: arLoading, remove: removeRemedy } = useActiveRemedies(pseudonymId);

  // Cycle tracking (Supabase-backed) — cycle day is derived, not entered manually
  const { cycles, settings, logPeriodStart } = useCycles(pseudonymId);
  const todayKey = toDateKey(new Date());
  const activeCycle = findActiveCycle(todayKey, cycles, settings);
  const autoCycleDay = getDayStatus(todayKey, cycles, settings).cycleDay;
  const [startingPeriod, setStartingPeriod] = useState(false);

  // Per-remedy entry state (quantity + logged flag)
  const [entries, setEntries] = useState<Record<string, RemedyEntry>>({});

  // Initialise entry state for newly loaded remedies
  useEffect(() => {
    setEntries((prev) => {
      const next = { ...prev };
      remedies.forEach((r) => {
        if (!next[r.id]) next[r.id] = { quantity: "", effectiveness: 5, logged: false, logging: false };
      });
      return next;
    });
  }, [remedies]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
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
    init();
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

  // ── Save diary entry ──────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!pseudonymId) return;
    setLoading(true);
    setError(null);

    const { error: dbErr } = await supabase.from("symptom_logs").insert({
      pseudonym_id:       pseudonymId,
      log_date:           new Date().toISOString().split("T")[0],
      pain_level:         pelvicPain,
      cycle_day:          autoCycleDay,
      bleeding_intensity: bleedingIntensity,
      mood,
      fatigue_level:      fatigue,
      notes:              notes || null,
    });

    setLoading(false);
    if (dbErr) { setError(dbErr.message); return; }

    setSuccess(true);
    setNotes("");
    setPelvicPain(5);
    setFatigue(4);
    setBleedingIntensity("none");
    setStress(null);
    setMood("neutral");
    loadLogs(pseudonymId);
  }

  // ── Log one remedy's dose ─────────────────────────────────────────────────

  async function logRemedy(remedy: ActiveRemedy, quantity: number | "", effectiveness?: number) {
    if (!pseudonymId) return;
    const eff = effectiveness ?? entries[remedy.id]?.effectiveness ?? 5;

    setEntries((prev) => ({
      ...prev,
      [remedy.id]: { ...prev[remedy.id], logging: true },
    }));

    const { error } = await supabase.from("remedy_logs").insert({
      pseudonym_id:     pseudonymId,
      remedy_name:      remedy.remedy_name,
      remedy_category:  remedy.remedy_category,
      effectiveness:    eff,
      duration_minutes: quantity === "" ? null : Number(quantity),
      notes:            null,
    });

    setEntries((prev) => ({
      ...prev,
      [remedy.id]: { ...prev[remedy.id], quantity, logged: !error, logging: false },
    }));
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PageShell title="Symptom diary" subtitle="Daily entry with optional sensitive fields.">

      {/* ── Today's Remedies — shown at the TOP so it's the first thing seen ── */}
      {!arLoading && remedies.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-inkStrong">Today's Remedies</h2>
              <p className="text-xs text-inkMuted mt-0.5">
                Tap an amount to log instantly — no need to re-select.
              </p>
            </div>
            <a href="/remedies" className="text-xs text-primary hover:underline">
              Manage regimen
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {remedies.map((remedy) => {
              const entry       = entries[remedy.id] ?? { quantity: "", effectiveness: 5, logged: false, logging: false };
              const quickAmts   = getQuickAmounts(remedy.remedy_category);

              return (
                <div
                  key={remedy.id}
                  className={[
                    "rounded-3xl px-4 py-4 ring-1 transition-all",
                    entry.logged
                      ? "bg-green-50 ring-green-200"
                      : "bg-bg ring-ink/10 shadow-sm",
                  ].join(" ")}
                >
                  {/* Remedy name row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl leading-none">{remedy.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-inkStrong truncate">
                        {remedy.remedy_name}
                      </p>
                      <p className="text-xs text-inkMuted capitalize">{remedy.remedy_category}</p>
                    </div>
                    {entry.logged && (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        ✓ Done
                      </span>
                    )}
                    {/* Remove from regimen */}
                    <button
                      type="button"
                      onClick={() => removeRemedy(remedy.id)}
                      title="Remove from My Remedies"
                      className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-inkMuted hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg viewBox="0 0 14 14" width="9" height="9" fill="none" aria-hidden>
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>

                  {entry.logged ? (
                    <p className="text-xs text-green-600">
                      Logged{entry.quantity !== "" ? ` · ${entry.quantity} ${remedy.unit}` : ""}
                      {" "}· {EFFECTIVENESS_OPTS.find(o => o.value === (entry.effectiveness ?? 5))?.label}
                    </p>
                  ) : (
                    <>
                      {/* Effectiveness quick-pick */}
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs text-inkMuted">Helped?</span>
                        <div className="flex gap-1.5">
                          {EFFECTIVENESS_OPTS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              title={opt.title}
                              onClick={() =>
                                setEntries((prev) => ({
                                  ...prev,
                                  [remedy.id]: { ...prev[remedy.id], effectiveness: opt.value },
                                }))
                              }
                              className={[
                                "h-8 w-8 rounded-full text-base transition-all",
                                (entry.effectiveness ?? 5) === opt.value
                                  ? "bg-primary/15 ring-2 ring-primary scale-110"
                                  : "bg-bgSoft ring-1 ring-ink/10 hover:bg-bgMuted",
                              ].join(" ")}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount chips — tap one to log immediately */}
                      {quickAmts.length > 0 && remedy.unit && (
                        <div className="mb-2">
                          <p className="mb-1.5 text-xs text-inkMuted">{remedy.unit}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {quickAmts.map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                disabled={entry.logging}
                                onClick={() => logRemedy(remedy, amt)}
                                className={[
                                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                                  entry.logging
                                    ? "opacity-50 cursor-wait"
                                    : "bg-bgSoft ring-1 ring-ink/10 text-inkStrong hover:bg-primary hover:text-white hover:ring-primary",
                                ].join(" ")}
                              >
                                {entry.logging ? "…" : `${amt} ${remedy.unit}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom amount input + log button */}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          min={1}
                          placeholder={remedy.unit ? `Custom ${remedy.unit}` : "Amount"}
                          value={entry.quantity}
                          onChange={(e) =>
                            setEntries((prev) => ({
                              ...prev,
                              [remedy.id]: {
                                ...(prev[remedy.id] ?? { effectiveness: 5, logged: false, logging: false }),
                                quantity: e.target.value === "" ? "" : Number(e.target.value),
                              },
                            }))
                          }
                          className="h-9 w-full rounded-2xl bg-bgSoft px-3 ring-1 ring-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent2"
                        />
                        <button
                          type="button"
                          disabled={entry.logging || !pseudonymId}
                          onClick={() => logRemedy(remedy, entry.quantity)}
                          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {entry.logging ? "…" : "Log"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main diary form + recent logs ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        <Card title="Recent logs" description="Your last 7 entries." className="order-2 lg:order-1">
          {logs.length === 0 ? (
            <p className="text-sm text-inkMuted">No logs yet. Start tracking today!</p>
          ) : (
            <div className="mt-2 space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-2xl bg-bgMuted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-inkStrong">{log.log_date}</span>
                    <span className="text-xs text-inkMuted">Pain {log.pain_level}/10</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-inkMuted">
                    {log.bleeding_intensity && log.bleeding_intensity !== "none" && (
                      <span className="capitalize">Bleeding: {log.bleeding_intensity}</span>
                    )}
                    {log.mood && <span className="capitalize">Mood: {log.mood}</span>}
                    {log.fatigue_level != null && <span>· Fatigue {log.fatigue_level}/10</span>}
                  </div>
                  {log.notes && <p className="mt-1 text-xs text-inkMuted">{log.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Today's entry" description="Log your symptoms." className="order-1 lg:order-2">
          <div className="mt-4 grid gap-4">
            <Slider010 label="Pelvic pain" description="0 = none · 10 = worst" value={pelvicPain} onChange={setPelvicPain} />
            <Slider010 label="Fatigue" value={fatigue} onChange={setFatigue} />

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">Cycle Day</label>
              <p className="mt-3 text-sm text-inkMuted">
                {autoCycleDay != null ? (
                  <>Day <span className="font-semibold text-inkStrong">{autoCycleDay}</span> of your cycle</>
                ) : (
                  "No active cycle — log a period start on the Cycle page or below to begin tracking."
                )}
              </p>
            </div>

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">Bleeding</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {["none", "spotting", "light", "medium", "heavy"].map((v) => (
                  <button key={v} type="button" onClick={() => setBleedingIntensity(v)}
                    className={[
                      "rounded-full px-4 py-2 text-sm capitalize transition-colors",
                      bleedingIntensity === v
                        ? "bg-primary text-white"
                        : "bg-bgMuted text-inkStrong ring-1 ring-ink/10 hover:bg-bgSoft",
                    ].join(" ")}
                  >
                    {v === "none" ? "None" : v}
                  </button>
                ))}
              </div>

              {bleedingIntensity !== "none" && !activeCycle && (
                <div className="mt-3 rounded-2xl bg-pink-50 px-4 py-3 ring-1 ring-pink-200">
                  <p className="text-sm text-inkStrong">No period currently tracked for today.</p>
                  <p className="mt-0.5 text-xs text-inkMuted">
                    Is this the start of a new period, or bleeding outside your period (breakthrough)?
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={startingPeriod || !pseudonymId}
                    onClick={async () => {
                      setStartingPeriod(true);
                      await logPeriodStart(todayKey, undefined);
                      setStartingPeriod(false);
                    }}
                    className="mt-2"
                  >
                    {startingPeriod ? "Starting…" : "Yes, my period started today"}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">Mood</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { v: "happy",    l: "😊 Happy" },
                  { v: "neutral",  l: "😐 Neutral" },
                  { v: "sad",      l: "😢 Sad" },
                  { v: "anxious",  l: "😰 Anxious" },
                  { v: "irritable",l: "😤 Irritable" },
                ].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setMood(v)}
                    className={[
                      "rounded-full px-4 py-2 text-sm transition-colors",
                      mood === v
                        ? "bg-primary text-white"
                        : "bg-bgMuted text-inkStrong ring-1 ring-ink/10 hover:bg-bgSoft",
                    ].join(" ")}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Likert label="Stress" description="How stressed were you today?" value={stress} onChange={setStress} optional />

            <SensitiveSection title="Sexual health (optional)">
              <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
                <p className="text-sm font-medium text-inkStrong">Sexually active today</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => setSexuallyActive(v)}
                      className={[
                        "h-11 rounded-full text-sm font-medium transition-colors",
                        sexuallyActive === v
                          ? v ? "bg-accent text-inkStrong" : "bg-success text-inkStrong"
                          : "bg-bgMuted/60 text-inkStrong hover:bg-bgMuted",
                      ].join(" ")}
                    >
                      {v ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
              <Slider010 label="Pain during sex" value={painDuringSex} onChange={setPainDuringSex} optional />
            </SensitiveSection>

            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
              <label className="text-sm font-medium text-inkStrong">Notes
                <span className="ml-2 text-xs font-normal text-inkMuted">optional</span>
              </label>
              <p className="mt-1 text-xs text-inkMuted">Avoid real names or identifying details.</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-3 min-h-24 w-full rounded-2xl bg-bg px-4 py-3 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2 resize-none"
                placeholder="Optional notes…"
              />
            </div>

            {error   && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">✓ Symptom entry saved!</p>}

            <Button fullWidth disabled={loading} onClick={handleSubmit}>
              {loading ? "Saving…" : "Save entry"}
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
