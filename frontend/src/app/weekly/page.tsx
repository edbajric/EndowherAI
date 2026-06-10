"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider010 } from "@/components/forms/Slider010";
import { Likert } from "@/components/forms/Likert";
import { SensitiveSection } from "@/components/forms/SensitiveSection";
import type { AssessmentResult, LIMEFactor } from "@/components/insights/AIInsightsPanel";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOTAL_STEPS = 4;

const RISK_STYLE = {
  Low:      { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-600",  bar: "bg-green-400" },
  Moderate: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-600",  bar: "bg-amber-400" },
  High:     { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-600",    bar: "bg-red-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {step}
        </span>
        <h2 className="text-base font-semibold text-inkStrong">{title}</h2>
      </div>
      <p className="ml-10 text-sm text-inkMuted">{subtitle}</p>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-inkMuted">Step {current} of {total}</span>
        <span className="text-xs font-medium text-primary">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-bgMuted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function PillGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: string[];
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-inkStrong">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              value === i
                ? "bg-primary text-white"
                : "bg-bgMuted text-inkStrong hover:bg-bgSoft ring-1 ring-ink/10",
            ].join(" ")}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyPage() {
  const supabase = createClient();
  const [pseudonymId, setPseudonymId] = useState<string | null>(null);
  const [step,        setStep]        = useState(1);
  const [saving,      setSaving]      = useState(false);
  const [scoring,     setScoring]     = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [aiResult,    setAiResult]    = useState<AssessmentResult | null>(null);
  const [aiError,     setAiError]     = useState<string | null>(null);
  const [logs,        setLogs]        = useState<any[]>([]);

  // ── Step 1: Pain severity ────────────────────────────────────────────────
  const [periodPain,    setPeriodPain]    = useState(4);
  const [pelvicPain,    setPelvicPain]    = useState(3);
  const [abdominalPain, setAbdominalPain] = useState(3);
  const [lowerBackPain, setLowerBackPain] = useState(3);
  const [hipLegPain,    setHipLegPain]    = useState(2);
  const [sharpPain,     setSharpPain]     = useState(2);
  const [overallPain,   setOverallPain]   = useState(4);

  // ── Step 2: Bleeding, cycle & bloating ──────────────────────────────────
  const [heavyBleeding,   setHeavyBleeding]   = useState(0);
  const [bloating,        setBloating]        = useState(0);
  const [cycleRegularity, setCycleRegularity] = useState(0);
  const [dizziness,       setDizziness]       = useState(0);

  // ── Step 3: Body & mind ──────────────────────────────────────────────────
  const [fatigue,       setFatigue]       = useState(0);
  const [headaches,     setHeadaches]     = useState(0);
  const [moodAnxiety,   setMoodAnxiety]   = useState<number | null>(null);
  const [qualityOfLife, setQualityOfLife] = useState(5);
  const [sleepQuality,  setSleepQuality]  = useState<number | null>(null);
  const [bowelSymptoms, setBowelSymptoms] = useState(0);
  const [urinaryPain,   setUrinaryPain]   = useState(0);

  // ── Step 4: Lifestyle & personal ────────────────────────────────────────
  const [painfulOvulation, setPainfulOvulation] = useState(0);
  const [painDuringSex,    setPainDuringSex]    = useState(0);
  const [antiInflDiet,     setAntiInflDiet]     = useState(0);
  const [pelvicFloor,      setPelvicFloor]      = useState(0);
  const [age,              setAge]              = useState(25);
  const [bmi,              setBmi]              = useState(22.0);
  const [notes,            setNotes]            = useState("");

  // ─────────────────────────────────────────────────────────────────────────

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
      .from("weekly_logs")
      .select("*")
      .eq("pseudonym_id", pid)
      .order("week_start", { ascending: false })
      .limit(4);
    if (data) setLogs(data);
  }

  async function handleSave() {
    if (!pseudonymId) { setSaveError("Not authenticated — please log in."); return; }
    setSaving(true);
    setSaveError(null);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const { error } = await supabase.from("weekly_logs").insert({
      pseudonym_id:     pseudonymId,
      week_start:       weekStart.toISOString().split("T")[0],
      avg_pain:         Math.round((periodPain + pelvicPain + overallPain) / 3),
      bloating:         Math.min(bloating * 2, 10),
      sleep_quality:    sleepQuality,
      anxiety:          moodAnxiety,
      bowel_symptoms:   bowelSymptoms * 3,
      urinary_symptoms: urinaryPain * 5,
      notes:            notes || null,
    });

    setSaving(false);
    if (error) { setSaveError(error.message); return; }

    setSaveSuccess(true);
    if (pseudonymId) loadLogs(pseudonymId);
    runAIScore();
  }

  async function runAIScore() {
    setScoring(true);
    setAiError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`${API_URL}/api/v1/insights/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          period_pain:             periodPain,
          pelvic_pain:             pelvicPain,
          abdominal_pain:          abdominalPain,
          lower_back_pain:         lowerBackPain,
          hip_leg_pain:            hipLegPain,
          sharp_pelvic_pain:       sharpPain,
          painful_ovulation:       painfulOvulation,
          overall_chronic_pain:    overallPain,
          quality_of_life:         qualityOfLife,
          heavy_bleeding:          heavyBleeding,
          pain_during_sex:         painDuringSex,
          painful_bowel_movements: bowelSymptoms,
          urinary_pain:            urinaryPain,
          bloating_frequency:      bloating,
          dizziness:               dizziness,
          headaches_migraines:     headaches,
          mood_anxiety_depression: moodAnxiety ?? 0,
          fatigue:                 fatigue,
          cycle_regularity:        cycleRegularity,
          age,
          bmi,
          anti_inflammatory_diet:  antiInflDiet,
          pelvic_floor_physio:     pelvicFloor,
          include_explanation:     true,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any).detail ?? `API error ${res.status}`);
      }
      setAiResult(await res.json());
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setScoring(false);
    }
  }

  // ─── Results screen ────────────────────────────────────────────────────────

  if (saveSuccess) {
    const style = aiResult ? RISK_STYLE[aiResult.risk_category] : null;
    return (
      <PageShell title="Check-in saved ✓" subtitle="Here are your AI insights for this week.">
        <div className="max-w-2xl space-y-5">
          <div className="rounded-3xl bg-green-50 border border-green-200 px-5 py-4">
            <p className="text-sm font-semibold text-green-700">Weekly check-in saved successfully.</p>
          </div>

          {scoring && (
            <div className="rounded-3xl bg-bgSoft px-5 py-6 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primaryLight border-t-primary" />
              <p className="mt-3 text-sm text-inkMuted">Calculating your AI risk score…</p>
            </div>
          )}

          {aiResult && style && (
            <div className="rounded-3xl ring-1 ring-primary/15 px-6 py-5 bg-bg shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔬</span>
                <h3 className="text-base font-semibold text-inkStrong">AI Risk Score</h3>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${style.bg} ${style.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${style.text}`}>{aiResult.risk_category} Risk</span>
                  <span className={`text-2xl font-extrabold ${style.text}`}>
                    {Math.round(aiResult.probability * 100)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/50">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${style.bar}`}
                    style={{ width: `${aiResult.probability * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-inkMuted">
                  Probability your symptom pattern matches a diagnosed / suspected PCOS or Endometriosis profile in our research cohort.
                </p>
              </div>

              {aiResult.explanation.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-inkMuted">Key factors</p>
                  {aiResult.explanation.map((f: LIMEFactor, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-2xl bg-bgMuted/40 px-3 py-2.5">
                      <span className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${f.direction === "increases_risk" ? "bg-red-400" : "bg-green-400"}`}>
                        {f.direction === "increases_risk" ? "↑" : "↓"}
                      </span>
                      <p className="text-xs text-inkStrong leading-5">{f.rule}</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-inkMuted italic">
                ⚕️ Not a diagnosis. For educational insights based on research patterns only. Consult a healthcare professional.
              </p>
            </div>
          )}

          {aiError && (
            <div className="rounded-3xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-sm text-amber-700">AI score unavailable: {aiError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button href="/home">Back to dashboard</Button>
            <Button variant="secondary" onClick={() => { setSaveSuccess(false); setAiResult(null); setStep(1); }}>
              New check-in
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  return (
    <PageShell title="Weekly Check-in" subtitle="24 clinical symptoms · Takes about 3 minutes">
      <div className="max-w-2xl">
        <ProgressBar current={step} total={TOTAL_STEPS} />

        {/* ── Step 1 ── */}
        {step === 1 && (
          <Card>
            <StepHeader step={1} title="Pain Severity" subtitle="Rate each type of pain 0–10 (0 = none, 10 = worst possible)" />
            <div className="space-y-5">
              <Slider010 label="Period pain / cramps (dysmenorrhea)" value={periodPain} onChange={setPeriodPain} />
              <Slider010 label="Pelvic pain outside your period" value={pelvicPain} onChange={setPelvicPain} />
              <Slider010 label="Abdominal pain or pressure" value={abdominalPain} onChange={setAbdominalPain} />
              <Slider010 label="Lower back pain related to your cycle" value={lowerBackPain} onChange={setLowerBackPain} />
              <Slider010 label="Hip or leg pain related to your cycle" value={hipLegPain} onChange={setHipLegPain} />
              <Slider010 label="Sharp / stabbing pelvic pain" value={sharpPain} onChange={setSharpPain} />
              <Slider010 label="Overall chronic pain (all combined, last 3 months)" value={overallPain} onChange={setOverallPain} />
            </div>
          </Card>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <Card>
            <StepHeader step={2} title="Bleeding, Cycle & Bloating" subtitle="Patterns over the past week / cycle" />
            <div className="space-y-5">
              <PillGroup label="Heavy / extreme menstrual bleeding" value={heavyBleeding} onChange={setHeavyBleeding}
                options={["Never", "Sometimes", "Often", "Yes — very heavily"]} />
              <PillGroup label="Bloating / endo belly frequency" value={bloating} onChange={setBloating}
                options={["Never", "Rarely", "1–3 d/mo", "4–10 d/mo", ">10 d/mo", "Other"]} />
              <PillGroup label="Menstrual cycle pattern" value={cycleRegularity} onChange={setCycleRegularity}
                options={["Regular", "Mostly regular", "Somewhat irregular", "Irregular"]} />
              <PillGroup label="Dizziness / fainting around your period" value={dizziness} onChange={setDizziness}
                options={["Never", "Sometimes", "Often"]} />
            </div>
          </Card>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <Card>
            <StepHeader step={3} title="Body & Mind" subtitle="Systemic symptoms and quality of life" />
            <div className="space-y-5">
              <PillGroup label="Tiredness / exhaustion not improved by sleep" value={fatigue} onChange={setFatigue}
                options={["Never", "Rarely", "1–3 d/mo", "4–10 d/mo", ">10 d/mo", "Other"]} />
              <PillGroup label="Headaches / migraines related to cycle" value={headaches} onChange={setHeadaches}
                options={["Never", "Sometimes", "Often"]} />
              <Likert label="Mood swings, anxiety or depression (cycle-related)" value={moodAnxiety} onChange={setMoodAnxiety}
                optional options={[
                  {label:"Never",value:0},{label:"Rarely",value:1},{label:"Some cycles",value:2},
                  {label:"Most cycles",value:3},{label:"Every cycle",value:4},
                ]} />
              <Slider010 label="Quality of life impact (0 = not affected · 10 = severely)" value={qualityOfLife} onChange={setQualityOfLife} />
              <Likert label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} optional
                options={[
                  {label:"Very poor",value:0},{label:"Poor",value:1},{label:"Fair",value:2},
                  {label:"Good",value:3},{label:"Excellent",value:4},
                ]} />
              <SensitiveSection title="Digestive & urinary" hint="Optional — commonly reported with endometriosis">
                <div className="space-y-4 pt-2">
                  <PillGroup label="Painful bowel movements around period" value={bowelSymptoms} onChange={setBowelSymptoms}
                    options={["Never", "Sometimes", "Often"]} />
                  <PillGroup label="Pain / burning when urinating" value={urinaryPain} onChange={setUrinaryPain}
                    options={["Never", "Sometimes", "Often"]} />
                </div>
              </SensitiveSection>
            </div>
          </Card>
        )}

        {/* ── Step 4 ── */}
        {step === 4 && (
          <Card>
            <StepHeader step={4} title="Lifestyle & Personal" subtitle="Improves AI accuracy — all fields optional" />
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-inkStrong">Age</label>
                  <input type="number" min={12} max={65}
                    className="mt-1 h-10 w-full rounded-2xl bg-bg px-4 ring-1 ring-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent2"
                    value={age} onChange={(e) => setAge(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-inkStrong">BMI</label>
                  <input type="number" min={15} max={60} step={0.1}
                    className="mt-1 h-10 w-full rounded-2xl bg-bg px-4 ring-1 ring-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent2"
                    value={bmi} onChange={(e) => setBmi(Number(e.target.value))} />
                </div>
              </div>
              <Slider010 label="Painful ovulation (mid-cycle pain)" value={painfulOvulation} onChange={setPainfulOvulation} optional />
              <SensitiveSection title="Sexual health" hint="Optional — skip if not applicable">
                <div className="pt-2">
                  <PillGroup label="Pain during sexual intercourse" value={painDuringSex} onChange={setPainDuringSex}
                    options={["Never", "Sometimes", "Often", "Very often"]} />
                </div>
              </SensitiveSection>
              <Slider010 label="Anti-inflammatory diet effectiveness (0 = not tried)" value={antiInflDiet} onChange={setAntiInflDiet} optional />
              <Slider010 label="Pelvic floor / physiotherapy effectiveness" value={pelvicFloor} onChange={setPelvicFloor} optional />
              <div>
                <label className="text-sm font-medium text-inkStrong">Notes <span className="font-normal text-inkMuted">(optional)</span></label>
                <textarea rows={3} placeholder="Patterns, triggers, or context for this week…"
                  className="mt-1 w-full rounded-2xl bg-bg px-4 py-3 ring-1 ring-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent2 resize-none"
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
                <p className="mt-1 text-xs text-inkMuted">Avoid including names or other identifying details.</p>
              </div>
            </div>
          </Card>
        )}

        {saveError && (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">{saveError}</p>
        )}

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-inkMuted ring-1 ring-ink/10 hover:text-inkStrong disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep((s) => s + 1)}>Continue →</Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || !pseudonymId}>
              {saving ? "Saving…" : "Save & Get AI Score"}
            </Button>
          )}
        </div>

        {/* Past check-ins */}
        {logs.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-3 text-sm font-semibold text-inkStrong">Past check-ins</h3>
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="rounded-2xl bg-bgMuted/40 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-inkStrong">Week of {l.week_start}</p>
                    <p className="text-xs text-inkMuted mt-0.5">
                      Pain {l.avg_pain}/10 · Bloating {l.bloating}/10
                      {l.sleep_quality != null ? ` · Sleep ${l.sleep_quality}/4` : ""}
                    </p>
                  </div>
                  {l.notes && (
                    <p className="text-xs text-inkMuted max-w-35 truncate">{l.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
