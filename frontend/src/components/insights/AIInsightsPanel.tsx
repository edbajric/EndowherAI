"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LIMEFactor {
  symptom: string;
  rule: string;
  contribution: number;
  direction: "increases_risk" | "decreases_risk";
}

export interface AssessmentResult {
  probability: number;
  risk_category: "Low" | "Moderate" | "High";
  explanation: LIMEFactor[];
}

interface AIInsightsPanelProps {
  /** Called after a successful prediction so parent (home page) can share context with FloatingChat */
  onResult?: (result: AssessmentResult) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const RISK_STYLE = {
  Low:      { bg: "bg-success/10",  border: "border-success/25",  text: "text-success",      bar: "bg-success" },
  Moderate: { bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-600",    bar: "bg-amber-400" },
  High:     { bg: "bg-red-50",      border: "border-red-200",     text: "text-red-600",      bar: "bg-red-400" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-inkStrong">{label}</span>
        <span className="text-xs font-bold text-primary">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
      />
    </div>
  );
}

function SelectRow({
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
      <label className="text-xs font-medium text-inkStrong">{label}</label>
      <select
        className="mt-1 h-9 w-full rounded-2xl bg-bg px-3 ring-1 ring-ink/10 text-xs focus:outline-none focus:ring-2 focus:ring-accent2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((o, i) => (
          <option key={i} value={i}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIInsightsPanel({ onResult }: AIInsightsPanelProps) {
  const supabase = createClient();

  const [formOpen, setFormOpen]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<AssessmentResult | null>(null);

  // Form state – 8 key clinical inputs (others use training-distribution defaults in FastAPI)
  const [periodPain,    setPeriodPain]    = useState(5);
  const [pelvicPain,    setPelvicPain]    = useState(3);
  const [overallPain,   setOverallPain]   = useState(4);
  const [qualityOfLife, setQualityOfLife] = useState(5);
  const [heavyBleeding, setHeavyBleeding] = useState(0);
  const [bloating,      setBloating]      = useState(0);
  const [age,           setAge]           = useState(25);
  const [bmi,           setBmi]           = useState(22.0);

  async function handlePredict() {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in to get your risk score.");

      const res = await fetch(`${API_URL}/api/v1/insights/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          period_pain:          periodPain,
          pelvic_pain:          pelvicPain,
          overall_chronic_pain: overallPain,
          quality_of_life:      qualityOfLife,
          heavy_bleeding:       heavyBleeding,
          bloating_frequency:   bloating,
          age,
          bmi,
          include_explanation:  true,
        }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error((detail as any).detail ?? `Server error ${res.status}`);
      }

      const data: AssessmentResult = await res.json();
      setResult(data);
      setFormOpen(false);
      onResult?.(data);
    } catch (e: any) {
      const msg: string = e.message ?? "";
      setError(
        msg.toLowerCase().includes("failed to fetch")
          ? `Cannot reach the backend. Make sure it's running:\n  cd backend && uvicorn app.main:app --reload --port 8000`
          : msg || "Prediction failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  const style = result ? RISK_STYLE[result.risk_category] : null;

  return (
    <div className="rounded-3xl bg-linear-to-br from-bgSoft to-bg ring-1 ring-primary/15 px-6 py-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔬</span>
            <h3 className="text-base font-semibold text-inkStrong">AI Risk Insights</h3>
          </div>
          <p className="mt-0.5 text-sm text-inkMuted max-w-sm">
            {result
              ? `Last assessment · ${result.risk_category} risk (${Math.round(result.probability * 100)}%)`
              : "Run a personalised PCOS / Endometriosis risk assessment using our trained model."}
          </p>
        </div>
        <button
          onClick={() => { setFormOpen(!formOpen); setError(null); }}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          {result ? "Re-assess" : "Assess me"}
        </button>
      </div>

      {/* Result card */}
      {result && !formOpen && (
        <div className="mt-4 space-y-3">
          {/* Risk gauge */}
          <div className={`rounded-2xl border px-4 py-3 ${style!.bg} ${style!.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${style!.text}`}>
                {result.risk_category} Risk
              </span>
              <span className={`text-xl font-extrabold ${style!.text}`}>
                {Math.round(result.probability * 100)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/50">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${style!.bar}`}
                style={{ width: `${result.probability * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-inkMuted">
              Probability that your symptom profile matches a diagnosed/suspected PCOS or Endometriosis pattern in our research cohort.
            </p>
          </div>

          {/* LIME factors */}
          {result.explanation.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-inkMuted">
                Why this score
              </p>
              <div className="space-y-2">
                {result.explanation.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-2xl bg-bgMuted/40 px-3 py-2.5"
                  >
                    <span
                      className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        f.direction === "increases_risk" ? "bg-red-400" : "bg-success"
                      }`}
                    >
                      {f.direction === "increases_risk" ? "↑" : "↓"}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-inkStrong leading-5">
                        {f.symptom.length > 55 ? f.symptom.slice(0, 55) + "…" : f.symptom}
                      </p>
                      <p className="text-xs text-inkMuted">{f.rule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-inkMuted italic">
            ⚕️ Not a medical diagnosis. For educational insights only — always consult a healthcare professional.
          </p>
        </div>
      )}

      {/* Assessment form */}
      {formOpen && (
        <div className="mt-5 space-y-5">
          <p className="text-xs text-inkMuted">
            Answer 8 quick questions. Unprovided fields use research-cohort defaults.
          </p>

          {/* Pain sliders */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-inkMuted">Pain levels (0 = none · 10 = severe)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderRow label="Period pain / cramps"       value={periodPain}    onChange={setPeriodPain} />
              <SliderRow label="Pelvic pain outside period" value={pelvicPain}    onChange={setPelvicPain} />
              <SliderRow label="Overall chronic pain"       value={overallPain}   onChange={setOverallPain} />
              <SliderRow label="Quality of life impact"     value={qualityOfLife} onChange={setQualityOfLife} />
            </div>
          </div>

          {/* Categorical symptoms */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-inkMuted">Symptom patterns</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectRow
                label="Heavy / extreme bleeding"
                value={heavyBleeding}
                onChange={setHeavyBleeding}
                options={["Never", "Sometimes", "Often", "Yes — very heavily"]}
              />
              <SelectRow
                label="Bloating / endo belly"
                value={bloating}
                onChange={setBloating}
                options={["Never", "Rarely", "1–3 days/month", "4–10 days/month", ">10 days/month", "Other"]}
              />
            </div>
          </div>

          {/* Demographics */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-inkMuted">About you</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-inkStrong">Age</label>
                <input
                  type="number"
                  min={12}
                  max={65}
                  className="mt-1 h-9 w-full rounded-2xl bg-bg px-3 ring-1 ring-ink/10 text-xs focus:outline-none focus:ring-2 focus:ring-accent2"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-inkStrong">BMI (weight kg ÷ height m²)</label>
                <input
                  type="number"
                  min={15}
                  max={60}
                  step={0.1}
                  className="mt-1 h-9 w-full rounded-2xl bg-bg px-3 ring-1 ring-ink/10 text-xs focus:outline-none focus:ring-2 focus:ring-accent2"
                  value={bmi}
                  onChange={(e) => setBmi(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handlePredict}
              disabled={loading}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Calculating…" : "Get My Risk Score"}
            </button>
            <button
              onClick={() => setFormOpen(false)}
              className="rounded-full px-4 py-2.5 text-sm text-inkMuted hover:text-inkStrong transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-inkMuted italic">
            ⚕️ This tool uses anonymized research data. It is not a clinical diagnosis. Consult a doctor for medical advice.
          </p>
        </div>
      )}
    </div>
  );
}
