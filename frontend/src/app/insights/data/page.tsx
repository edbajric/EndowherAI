'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SymptomStat {
  label: string;
  avg_score: number;
  pct_moderate: number;
}

interface RemedyStat {
  label: string;
  category: string;
  usage_count: number;
  usage_pct: number;
  avg_effectiveness: number;
}

interface CommunityData {
  generated_at: string;
  sample_size: number;
  condition_breakdown: {
    endo_only: number;
    pcos_only: number;
    both: number;
    neither: number;
  };
  symptom_prevalence: {
    endo: SymptomStat[];
    pcos: SymptomStat[];
    both: SymptomStat[];
    overall: SymptomStat[];
  };
  remedy_effectiveness: RemedyStat[];
  remedy_by_condition: {
    endo: RemedyStat[];
    pcos: RemedyStat[];
    both: RemedyStat[];
  };
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  tea: '🍵', supplement: '💊', exercise: '🏃', heat: '🌡️',
  diet: '🥗', meditation: '🧘', medication: '💉', other: '✏️',
};

function effBarColor(eff: number) {
  if (eff >= 7) return '#22c55e';
  if (eff >= 5) return '#fbbf24';
  if (eff >= 3) return '#fb923c';
  return '#f87171';
}

// ─── Custom tooltip ────────────────────────────────────────────────────────────

function SymptomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-bg ring-1 ring-ink/10 px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold text-inkStrong">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
}

// ─── Symptom chart ────────────────────────────────────────────────────────────

function SymptomChart({ data }: { data: CommunityData }) {
  // Build top-12 symptoms by "endo" avg, showing endo/pcos/both side by side
  const endoMap = new Map(data.symptom_prevalence.endo.map(s => [s.label, s.pct_moderate]));
  const pcosMap = new Map(data.symptom_prevalence.pcos.map(s => [s.label, s.pct_moderate]));
  const bothMap = new Map(data.symptom_prevalence.both.map(s => [s.label, s.pct_moderate]));

  const top = data.symptom_prevalence.endo.slice(0, 12).map(s => ({
    label: s.label,
    Endo:  endoMap.get(s.label) ?? 0,
    PCOS:  pcosMap.get(s.label) ?? 0,
    Both:  bothMap.get(s.label) ?? 0,
  }));

  return (
    <div className="space-y-2">
      <p className="text-xs text-inkMuted">
        % of respondents per group reporting each symptom at moderate-to-severe level (score ≥ 5 / 10).
        Ordered by endometriosis prevalence.
      </p>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={130} />
          <Tooltip content={<SymptomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="Endo" name="Endo only" fill="#a78bfa" radius={[0, 3, 3, 0]} />
          <Bar dataKey="PCOS" name="PCOS only" fill="#67e8f9" radius={[0, 3, 3, 0]} />
          <Bar dataKey="Both" name="Both"       fill="#34d399" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Remedy chart ─────────────────────────────────────────────────────────────

function RemedyChart({ remedies }: { remedies: RemedyStat[] }) {
  const sorted = [...remedies].sort((a, b) => b.avg_effectiveness - a.avg_effectiveness);

  return (
    <div className="space-y-2">
      <p className="text-xs text-inkMuted">
        Average effectiveness rating (0–10) among survey respondents who used each remedy.
        Bar colour reflects rating level.
      </p>
      <div className="space-y-2 mt-1">
        {sorted.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="text-[11px] text-inkMuted w-4 shrink-0 text-right">#{i + 1}</span>
            <span className="text-sm shrink-0">{CAT_EMOJI[r.category] ?? '✏️'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-medium text-inkStrong truncate">{r.label}</p>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-inkMuted">{r.usage_pct.toFixed(0)}% used</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: effBarColor(r.avg_effectiveness) }}
                  >
                    {r.avg_effectiveness.toFixed(1)}/10
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-ink/8 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(r.avg_effectiveness / 10) * 100}%`,
                    backgroundColor: effBarColor(r.avg_effectiveness),
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Per-condition remedy table ────────────────────────────────────────────────

function ConditionRemedyTable({
  endo,
  pcos,
  both,
}: {
  endo: RemedyStat[];
  pcos: RemedyStat[];
  both: RemedyStat[];
}) {
  const [tab, setTab] = useState<'endo' | 'pcos' | 'both'>('endo');
  const rows = { endo, pcos, both }[tab].slice(0, 10);
  const labels = { endo: 'Endometriosis', pcos: 'PCOS', both: 'Both' } as const;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['endo', 'pcos', 'both'] as const).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              tab === k
                ? 'bg-primary text-white'
                : 'bg-bgSoft ring-1 ring-ink/10 text-inkStrong hover:bg-primary/10',
            ].join(' ')}
          >
            {labels[k]}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-2.5 rounded-xl bg-bgMuted/40 px-3 py-2">
            <span className="text-[10px] text-inkMuted w-4 text-right shrink-0">#{i + 1}</span>
            <span className="text-sm shrink-0">{CAT_EMOJI[r.category] ?? '✏️'}</span>
            <p className="flex-1 text-xs font-medium text-inkStrong truncate">{r.label}</p>
            <span
              className="text-xs font-bold shrink-0"
              style={{ color: effBarColor(r.avg_effectiveness) }}
            >
              {r.avg_effectiveness.toFixed(1)}/10
            </span>
            <span className="text-[10px] text-inkMuted shrink-0">{r.usage_pct.toFixed(0)}% used</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataDrivenInsightsPage() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    fetch(`${apiUrl}/api/v1/insights/community`)
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell
      title="Research insights"
      subtitle={
        data
          ? `Based on ${data.sample_size} survey responses · Generated ${data.generated_at}`
          : 'Community symptom patterns and remedy effectiveness from survey data.'
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-inkMuted">Loading community data…</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-red-50 ring-1 ring-red-200 px-5 py-6 text-sm text-red-700">
          Could not load insights: {error}
          <p className="mt-1 text-xs text-red-500">Make sure the backend is running.</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* ── Condition breakdown ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Endometriosis only', value: data.condition_breakdown.endo_only, color: 'text-violet-700 bg-violet-50 ring-violet-200' },
              { label: 'PCOS only',           value: data.condition_breakdown.pcos_only, color: 'text-cyan-700 bg-cyan-50 ring-cyan-200' },
              { label: 'Both conditions',     value: data.condition_breakdown.both,      color: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
              { label: 'Neither / unsure',    value: data.condition_breakdown.neither,   color: 'text-neutral-600 bg-neutral-50 ring-neutral-200' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`rounded-3xl ring-1 px-4 py-4 text-center ${color}`}
              >
                <p className="text-2xl font-bold">{value}</p>
                <p className="mt-0.5 text-[11px] font-medium leading-tight">{label}</p>
                <p className="text-[10px] opacity-70">{((value / data.sample_size) * 100).toFixed(0)}% of sample</p>
              </div>
            ))}
          </div>

          {/* ── Symptom prevalence chart ── */}
          <Card
            title="Symptom prevalence by condition"
            description="How common each symptom is — comparing endometriosis, PCOS, and both."
          >
            <div className="mt-4">
              <SymptomChart data={data} />
            </div>
          </Card>

          {/* ── Remedy effectiveness ── */}
          <Card
            title="Most effective remedies (research data)"
            description="Ranked by average self-reported effectiveness among people who tried each remedy."
          >
            <div className="mt-4">
              <RemedyChart remedies={data.remedy_effectiveness} />
            </div>
          </Card>

          {/* ── Per-condition remedy breakdown ── */}
          <Card
            title="Top remedies by condition"
            description="Which remedies worked best for each specific condition, from survey data."
          >
            <div className="mt-4">
              <ConditionRemedyTable
                endo={data.remedy_by_condition.endo}
                pcos={data.remedy_by_condition.pcos}
                both={data.remedy_by_condition.both}
              />
            </div>
          </Card>

          <p className="text-center text-[11px] text-inkMuted">
            Research dataset · {data.sample_size} anonymous respondents ·{' '}
            English, Bosnian, and Turkish survey data · Generated {data.generated_at}
          </p>
        </div>
      ) : null}
    </PageShell>
  );
}
