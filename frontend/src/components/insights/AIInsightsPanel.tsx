'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LIMEFactor {
  symptom: string;
  rule: string;
  contribution: number;
  direction: 'increases_risk' | 'decreases_risk';
}

export interface AssessmentResult {
  probability: number;
  risk_category: 'Low' | 'Moderate' | 'High';
  explanation: LIMEFactor[];
}

interface AIInsightsPanelProps {
  onResult?: (result: AssessmentResult) => void;
}

// ─── LIME label map & filter ──────────────────────────────────────────────────

// Maps raw feature-name fragments → readable labels for KNOWN symptom features.
const LIME_LABELS: [string, string][] = [
  ['Period pain', 'Period pain / cramps'],
  ['Pelvic pain outside', 'Chronic pelvic pain'],
  ['Sharp or stabbing', 'Sharp / stabbing pelvic pain'],
  ['Painful ovulation', 'Painful ovulation'],
  ['Abdominal pain', 'Abdominal pain or pressure'],
  ['Lower back pain', 'Lower back pain'],
  ['Hip or leg pain', 'Hip / leg pain'],
  ['Overall chronic pain', 'Overall chronic pain'],
  ['quality of life', 'Quality-of-life impact'],
  ['heavy or extreme', 'Heavy / extreme bleeding'],
  ['pain or burning during sexual', 'Pain during sex'],
  ['pain after sexual', 'Pain after sex'],
  ['painful bowel', 'Painful bowel movements'],
  ['pain or burning when urinating', 'Urinary pain'],
  ['endo belly', 'Bloating / endo belly'],
  ['dizziness or fainting', 'Dizziness / fainting'],
  ['headaches or migraines', 'Headaches / migraines'],
  ['mood swings', 'Mood / anxiety / depression'],
  ['very tired or exhausted', 'Fatigue'],
  ['menstrual cycle pattern', 'Cycle regularity'],
  ['pain_composite_mean', 'Overall pain composite'],
  ['pain_composite_max', 'Peak pain level'],
  ['high_pain_count', 'Number of severe pain sites'],
  ['symptom_burden', 'Symptom burden score'],
  ['Anti', 'Anti-inflammatory diet'],
  ['Pelvic floor', 'Pelvic floor exercises'],
];

// Substrings that identify features unrelated to user-provided symptoms.
// Factors matching these are hidden — they come from diagnosis history or
// demographic outliers in the training set and aren't meaningful here.
const LIME_EXCLUDE_PATTERNS = [
  'pcos or a doctor',
  'endometriosis or a doctor',
  'how many years passed',
  'first time a doctor',
  'bmi',
  // Age is kept in LIME_LABELS but excluded from display because its scaler
  // range has outliers that make the scaled value uninformative for most users.
  'Age',
  // Remedy / tea features are model artefacts rather than user-entered
  // questionnaire items, so they should not be shown as actionable factors.
  'tea',
  'remedy',
  'herbal',
  'supplement',
  'medication',
];

export function getVisibleLIMEFactors(factors: LIMEFactor[]): LIMEFactor[] {
  return factors.filter(factor => readableLIMELabel(factor.symptom) !== null);
}

function readableLIMELabel(raw: string): string | null {
  const lower = raw.toLowerCase();
  // Exclude diagnosis-history and anomalous-scale features
  for (const pat of LIME_EXCLUDE_PATTERNS) {
    if (lower.includes(pat.toLowerCase())) return null;
  }
  for (const [keyword, label] of LIME_LABELS) {
    if (lower.includes(keyword.toLowerCase())) return label;
  }
  // Unknown feature — show truncated but still include (may be informative)
  return raw.length > 50 ? raw.slice(0, 50) + '…' : raw;
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const RISK_STYLE = {
  Low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    bar: 'bg-green-500',
  },
  Moderate: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    bar: 'bg-amber-400',
  },
  High: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', bar: 'bg-red-500' },
};

const RISK_DESC = {
  Low: 'Your reported symptoms show a low similarity to diagnosed PCOS / endometriosis patterns in our research cohort.',
  Moderate:
    'Your symptom profile has moderate overlap with PCOS / endometriosis patterns. Consider discussing with a gynaecologist.',
  High: 'Your symptom profile closely matches diagnosed PCOS / endometriosis patterns. We strongly recommend a specialist consultation.',
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
  const color = value >= 7 ? 'text-red-600' : value >= 4 ? 'text-amber-600' : 'text-green-600';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-inkStrong">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${color}`}>{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-inkMuted mt-0.5">
        <span>None</span>
        <span>Severe</span>
      </div>
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
        onChange={e => onChange(Number(e.target.value))}
      >
        {options.map((o, i) => (
          <option key={i} value={i}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AIInsightsPanel({ onResult }: AIInsightsPanelProps) {
  const supabase = createClient();

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // ── Pain (0-10 sliders) ──────────────────────────────────────────────────
  const [periodPain, setPeriodPain] = useState(0);
  const [pelvicPain, setPelvicPain] = useState(0);
  const [sharpPelvicPain, setSharpPelvicPain] = useState(0);
  const [painfulOvulation, setPainfulOvulation] = useState(0);
  const [overallPain, setOverallPain] = useState(0);
  const [qualityOfLife, setQualityOfLife] = useState(0);

  // ── Symptom patterns (categorical) ───────────────────────────────────────
  const [heavyBleeding, setHeavyBleeding] = useState(0);
  const [cycleRegularity, setCycleRegularity] = useState(0);
  const [bloating, setBloating] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [painDuringSex, setPainDuringSex] = useState(0);
  const [painfulBowel, setPainfulBowel] = useState(0);
  const [moodAnxiety, setMoodAnxiety] = useState(0);

  async function handlePredict() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in to get your risk score.');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v1/insights/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          period_pain: periodPain,
          pelvic_pain: pelvicPain,
          sharp_pelvic_pain: sharpPelvicPain,
          painful_ovulation: painfulOvulation,
          overall_chronic_pain: overallPain,
          quality_of_life: qualityOfLife,
          heavy_bleeding: heavyBleeding,
          cycle_regularity: cycleRegularity,
          bloating_frequency: bloating,
          fatigue: fatigue,
          pain_during_sex: painDuringSex,
          painful_bowel_movements: painfulBowel,
          mood_anxiety_depression: moodAnxiety,
          include_explanation: true,
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
      const msg: string = e.message ?? '';
      setError(
        msg.toLowerCase().includes('failed to fetch')
          ? "Cannot reach the backend. Make sure it's running on port 8000."
          : msg || 'Prediction failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  const style = result ? RISK_STYLE[result.risk_category] : null;

  return (
    <div className="rounded-3xl bg-linear-to-br from-bgSoft to-bg ring-1 ring-primary/15 px-6 py-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔬</span>
            <h3 className="text-base font-semibold text-inkStrong">AI Risk Insights</h3>
          </div>
          <p className="mt-0.5 text-sm text-inkMuted max-w-sm">
            {result
              ? `Last assessment · ${result.risk_category} risk · ${Math.round(result.probability * 100)}% match`
              : 'Personalised PCOS / Endometriosis risk assessment using our trained model.'}
          </p>
        </div>
        <button
          onClick={() => {
            setFormOpen(!formOpen);
            setError(null);
          }}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          {result ? 'Re-assess' : 'Assess me'}
        </button>
      </div>

      {/* Result card */}
      {result && !formOpen && (
        <div className="mt-4 space-y-3">
          <div className={`rounded-2xl border px-4 py-4 space-y-3 ${style!.bg} ${style!.border}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${style!.text}`}>
                {result.risk_category} Risk
              </span>
              <span className={`text-2xl font-extrabold tabular-nums ${style!.text}`}>
                {Math.round(result.probability * 100)}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/60">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${style!.bar}`}
                style={{ width: `${result.probability * 100}%` }}
              />
            </div>
            <p className="text-xs text-inkMuted leading-relaxed">
              {RISK_DESC[result.risk_category]}
            </p>
          </div>

          {(() => {
            const visibleFactors = getVisibleLIMEFactors(result.explanation).map(f => ({
              ...f,
              readableLabel: readableLIMELabel(f.symptom),
            }));
            if (visibleFactors.length === 0) return null;
            return (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-inkMuted">
                  Key factors that influenced your score
                </p>
                <div className="space-y-2">
                  {visibleFactors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-2xl bg-bgMuted/40 px-3 py-2.5"
                    >
                      <span
                        className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                          f.direction === 'increases_risk' ? 'bg-red-400' : 'bg-green-500'
                        }`}
                      >
                        {f.direction === 'increases_risk' ? '↑' : '↓'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-inkStrong leading-5">
                          {f.readableLabel}
                        </p>
                        <p className="text-[10px] text-inkMuted truncate">{f.rule}</p>
                      </div>
                      <span
                        className={`ml-auto shrink-0 text-xs font-bold tabular-nums ${
                          f.direction === 'increases_risk' ? 'text-red-500' : 'text-green-600'
                        }`}
                      >
                        {f.contribution > 0 ? '+' : ''}
                        {(f.contribution * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <p className="text-xs text-inkMuted italic">
            ⚕️ Not a medical diagnosis — for educational insights only. Always consult a healthcare
            professional.
          </p>
        </div>
      )}

      {/* Assessment form */}
      {formOpen && (
        <div className="mt-5 space-y-6">
          <p className="text-xs text-inkMuted">
            Rate your symptoms honestly. Unanswered questions default to 0 (none / never).
          </p>

          {/* ── Pain ── */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-inkMuted">
              Pain levels — 0 = none, 10 = severe
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <SliderRow label="Period pain / cramps" value={periodPain} onChange={setPeriodPain} />
              <SliderRow
                label="Pelvic pain outside period"
                value={pelvicPain}
                onChange={setPelvicPain}
              />
              <SliderRow
                label="Sharp / stabbing pelvic pain"
                value={sharpPelvicPain}
                onChange={setSharpPelvicPain}
              />
              <SliderRow
                label="Painful ovulation (mid-cycle)"
                value={painfulOvulation}
                onChange={setPainfulOvulation}
              />
              <SliderRow
                label="Overall chronic pain (3 months)"
                value={overallPain}
                onChange={setOverallPain}
              />
              <SliderRow
                label="How much symptoms affect daily life"
                value={qualityOfLife}
                onChange={setQualityOfLife}
              />
            </div>
          </div>

          {/* ── Cycle & bleeding ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-inkMuted">
              Cycle & bleeding
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectRow
                label="Heavy / extreme menstrual bleeding"
                value={heavyBleeding}
                onChange={setHeavyBleeding}
                options={['Never', 'Sometimes', 'Often', 'Yes — very heavily']}
              />
              <SelectRow
                label="Menstrual cycle pattern"
                value={cycleRegularity}
                onChange={setCycleRegularity}
                options={[
                  'Regular',
                  'Mostly regular',
                  'Somewhat irregular',
                  'Irregular / unpredictable',
                ]}
              />
            </div>
          </div>

          {/* ── Other symptoms ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-inkMuted">
              Other symptoms
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectRow
                label="Bloating / endo belly"
                value={bloating}
                onChange={setBloating}
                options={[
                  'Never',
                  'Rarely',
                  '1–3 days/month',
                  '4–10 days/month',
                  '>10 days/month',
                  'Almost every day',
                ]}
              />
              <SelectRow
                label="Fatigue not improved by sleep"
                value={fatigue}
                onChange={setFatigue}
                options={[
                  'Never',
                  'Rarely',
                  '1–3 days/month',
                  '4–10 days/month',
                  '>10 days/month',
                  'Almost every day',
                ]}
              />
              <SelectRow
                label="Painful bowel movements (around period)"
                value={painfulBowel}
                onChange={setPainfulBowel}
                options={['Never', 'Sometimes', 'Often']}
              />
              <SelectRow
                label="Pain during sexual intercourse"
                value={painDuringSex}
                onChange={setPainDuringSex}
                options={['Never', 'Sometimes', 'Often', 'Very often']}
              />
              <SelectRow
                label="Mood swings / anxiety / depression (cycle-related)"
                value={moodAnxiety}
                onChange={setMoodAnxiety}
                options={['Never', 'Rarely', 'Some cycles', 'Most cycles', 'Every cycle']}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-600 leading-relaxed whitespace-pre-line">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handlePredict}
              disabled={loading}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Calculating…' : 'Get My Risk Score'}
            </button>
            <button
              onClick={() => setFormOpen(false)}
              className="rounded-full px-4 py-2.5 text-sm text-inkMuted hover:text-inkStrong transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-inkMuted italic">
            ⚕️ This uses anonymised research data. It is not a clinical diagnosis — consult a doctor
            for medical advice.
          </p>
        </div>
      )}
    </div>
  );
}
