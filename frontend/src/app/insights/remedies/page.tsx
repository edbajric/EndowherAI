'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { useActiveRemedies } from '@/lib/active-remedies';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RemedyLog {
  remedy_name: string;
  remedy_category: string;
  effectiveness: number;
  log_date: string;
}

interface PersonalStat {
  remedy_name: string;
  remedy_category: string;
  log_count: number;
  avg_effectiveness: number;
  last_logged: string;
  first_logged: string;
  emoji: string;
  unit: string;
  started_at: string | undefined;
  is_active: boolean;
}

interface GlobalStat {
  remedy_name: string;
  remedy_category: string;
  user_count: number;
  log_count: number;
  avg_effectiveness: number;
}

interface TimelinePoint {
  date: string;
  effectiveness: number;
  quantity: number | null;
}

interface PainInsights {
  remedy_days_avg_pain: number | null;
  baseline_avg_pain: number | null;
  pain_reduction_pct: number | null;
  sufficient_data: boolean;
}

interface InsightData {
  remedy_name: string;
  remedy_category: string;
  days_in_regimen: number;
  total_logs: number;
  avg_effectiveness: number;
  effectiveness_trend: 'improving' | 'stable' | 'declining';
  trend_summary: string;
  consistency_score: number;
  best_dose: number | null;
  timeline: TimelinePoint[];
  pain_insights: PainInsights;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  tea: '🍵',
  supplement: '💊',
  exercise: '🏃',
  heat: '🌡️',
  diet: '🥗',
  meditation: '🧘',
  medication: '💉',
  other: '✏️',
};

const CAT_LABEL: Record<string, string> = {
  tea: 'Herbal Tea',
  supplement: 'Supplement',
  exercise: 'Exercise',
  heat: 'Heat Therapy',
  diet: 'Diet Change',
  meditation: 'Meditation',
  medication: 'Medication',
  other: 'Other',
};

const CAT_COLOR: Record<string, string> = {
  tea: 'bg-amber-100 text-amber-800',
  supplement: 'bg-violet-100 text-violet-800',
  exercise: 'bg-green-100 text-green-800',
  heat: 'bg-red-100 text-red-800',
  diet: 'bg-lime-100 text-lime-800',
  meditation: 'bg-sky-100 text-sky-800',
  medication: 'bg-pink-100 text-pink-800',
  other: 'bg-neutral-100 text-neutral-700',
};

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function EffBar({ value }: { value: number }) {
  const pct = (value / 10) * 100;
  const color = value >= 7 ? 'bg-green-400' : value >= 4 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="h-2 w-full rounded-full bg-ink/8 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EffBadge({ value }: { value: number }) {
  const color =
    value >= 7
      ? 'text-green-700 bg-green-50 ring-green-200'
      : value >= 4
        ? 'text-amber-700 bg-amber-50 ring-amber-200'
        : 'text-red-700 bg-red-50 ring-red-200';
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 rounded-full px-2 py-0.5 ring-1 text-xs font-bold ${color}`}
    >
      {value.toFixed(1)}
      <span className="font-normal text-[10px]">/10</span>
    </span>
  );
}

const TREND_META = {
  improving: { icon: '📈', label: 'Improving', color: 'text-green-700 bg-green-50 ring-green-200' },
  stable: { icon: '📊', label: 'Stable', color: 'text-amber-700 bg-amber-50 ring-amber-200' },
  declining: { icon: '📉', label: 'Declining', color: 'text-red-700 bg-red-50 ring-red-200' },
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function effColor(eff: number): string {
  if (eff >= 8) return '#22c55e';
  if (eff >= 6) return '#86efac';
  if (eff >= 4) return '#fbbf24';
  if (eff >= 2) return '#fb923c';
  return '#f87171';
}

function MonthlyCalendar({ logs }: { logs: RemedyLog[] }) {
  const logMap = new Map<string, { effectivenessSum: number; count: number }>();
  logs.forEach(log => {
    const existing = logMap.get(log.log_date);
    if (existing) {
      existing.effectivenessSum += log.effectiveness;
      existing.count++;
    } else {
      logMap.set(log.log_date, { effectivenessSum: log.effectiveness, count: 1 });
    }
  });

  const today = new Date();
  const allDates = [...logMap.keys()].sort();
  const firstDate = allDates.length > 0 ? new Date(allDates[0]) : today;

  const months: Date[] = [];
  let cur = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);
  while (cur <= end && months.length < 13) {
    months.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  if (months.length === 0) {
    return <p className="text-xs text-inkMuted">No logs yet.</p>;
  }

  const totalLogs = logs.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-inkStrong">Monthly usage</p>
        <p className="text-xs text-inkMuted">
          {totalLogs} log{totalLogs !== 1 ? 's' : ''} total
        </p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="space-y-1.5 min-w-0">
          {months.map(month => {
            const yr = month.getFullYear();
            const mo = month.getMonth();
            const daysInMonth = new Date(yr, mo + 1, 0).getDate();
            const label = month.toLocaleString('default', { month: 'short', year: '2-digit' });

            return (
              <div key={`${yr}-${mo}`} className="flex items-center gap-1.5">
                <span className="text-[10px] text-inkMuted w-8 shrink-0 text-right">{label}</span>
                <div className="flex gap-0.5 flex-nowrap">
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const entry = logMap.get(dateStr);
                    const isFuture = new Date(dateStr) > today;
                    const avgEff = entry ? entry.effectivenessSum / entry.count : 0;

                    return (
                      <div
                        key={dateStr}
                        title={
                          entry
                            ? `${dateStr} · ${avgEff.toFixed(1)}/10 · used ${entry.count}×`
                            : dateStr
                        }
                        className="h-4 w-4 rounded-[3px] shrink-0 cursor-default"
                        style={{
                          backgroundColor: isFuture
                            ? 'transparent'
                            : entry
                              ? effColor(avgEff)
                              : '#e5e7eb',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-inkMuted">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-[2px] bg-neutral-200 inline-block" />
          Not used
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-[2px] inline-block" style={{ backgroundColor: '#f87171' }} />
          1–3
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-[2px] inline-block" style={{ backgroundColor: '#fb923c' }} />
          4–5
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-[2px] inline-block" style={{ backgroundColor: '#fbbf24' }} />
          6–7
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-[2px] inline-block" style={{ backgroundColor: '#22c55e' }} />
          8–10
        </span>
      </div>
    </div>
  );
}

function SingleRemedyChart({ logs }: { logs: RemedyLog[] }) {
  if (logs.length < 2) return null;

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const data = sorted.map(l => ({ date: l.log_date, effectiveness: l.effectiveness }));
  const avg = Math.round((logs.reduce((s, l) => s + l.effectiveness, 0) / logs.length) * 10) / 10;

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-inkStrong">Effectiveness trend</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} minTickGap={40} />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v: any) => [`${v}/10`, 'Effectiveness']}
            labelFormatter={(d: any) => fmtDate(d)}
            contentStyle={{ fontSize: 11, borderRadius: 10 }}
          />
          <ReferenceLine y={avg} stroke="#a78bfa" strokeDasharray="4 4" strokeWidth={1.5} />
          <Line
            type="monotone"
            dataKey="effectiveness"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ r: 4, fill: '#7c3aed' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-inkMuted">
        Dashed line = your average ({avg}/10) · {logs.length} log{logs.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function DetailPanel({
  data,
  emoji,
  unit,
  remedyLogs,
  onClose,
}: {
  data: InsightData;
  emoji: string;
  unit: string;
  remedyLogs: RemedyLog[];
  onClose: () => void;
}) {
  const trend = TREND_META[data.effectiveness_trend];
  const pain = data.pain_insights;

  return (
    <div className="mt-3 rounded-3xl bg-bgMuted/30 ring-1 ring-ink/10 px-5 py-5 space-y-5">
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="text-sm font-bold text-inkStrong">{data.remedy_name}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${trend.color}`}
            >
              {trend.icon} {trend.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink/8 text-inkMuted hover:bg-ink/15 transition-colors"
          title="Close insights"
        >
          <svg viewBox="0 0 14 14" width="10" height="10" fill="none" aria-hidden>
            <path
              d="M2 2l10 10M12 2L2 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* ── Trend summary ── */}
      <p className="text-sm text-inkMuted leading-relaxed">{data.trend_summary}</p>

      {/* ── Trend line chart ── */}
      <SingleRemedyChart logs={remedyLogs} />

      {/* ── 3-col stat strip ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Avg effectiveness', value: `${data.avg_effectiveness}/10` },
          { label: 'Days in regimen', value: `${data.days_in_regimen}d` },
          { label: 'Total logs', value: String(data.total_logs) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-bg ring-1 ring-ink/8 px-3 py-3 text-center">
            <p className="text-lg font-bold text-inkStrong">{value}</p>
            <p className="mt-0.5 text-[10px] text-inkMuted leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Pain insight card ── */}
      <div
        className="rounded-2xl ring-1 px-4 py-4 space-y-1.5
        ring-ink/10 bg-bg"
      >
        <p className="text-xs font-semibold text-inkStrong">Pain correlation</p>
        {pain.sufficient_data ? (
          <>
            <p className="text-sm text-inkMuted leading-relaxed">
              On days you used this, your pain averaged{' '}
              <strong className="text-inkStrong">{pain.remedy_days_avg_pain}/10</strong> vs.{' '}
              <strong className="text-inkStrong">{pain.baseline_avg_pain}/10</strong> on other days.
            </p>
            {pain.pain_reduction_pct !== null && (
              <p
                className={`text-xs font-semibold ${pain.pain_reduction_pct > 0 ? 'text-green-700' : 'text-red-600'}`}
              >
                {pain.pain_reduction_pct > 0
                  ? `↓ ${pain.pain_reduction_pct.toFixed(0)}% lower pain on remedy days`
                  : `↑ ${Math.abs(pain.pain_reduction_pct).toFixed(0)}% higher pain on remedy days`}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-inkMuted">
            Log diary entries on the same days you use this remedy to unlock pain correlation.
            {pain.remedy_days_avg_pain !== null && (
              <>
                {' '}
                ({data.total_logs} remedy log{data.total_logs !== 1 ? 's' : ''} so far — need ≥3
                with matching diary entries.)
              </>
            )}
          </p>
        )}
      </div>

      {/* ── Consistency ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-inkStrong">Consistency</p>
          <p className="text-xs text-inkMuted">
            {data.consistency_score.toFixed(0)}% of regimen days logged
          </p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-ink/8 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              data.consistency_score >= 60
                ? 'bg-green-400'
                : data.consistency_score >= 30
                  ? 'bg-amber-400'
                  : 'bg-red-400'
            }`}
            style={{ width: `${Math.min(data.consistency_score, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-inkMuted">
          Based on the last {Math.min(30, data.days_in_regimen)} days
        </p>
      </div>

      {/* ── Best dose ── */}
      {data.best_dose !== null && unit && (
        <div className="rounded-2xl bg-primary/5 ring-1 ring-primary/15 px-4 py-3">
          <p className="text-xs font-semibold text-primary">Optimal dose</p>
          <p className="mt-0.5 text-sm text-inkMuted">
            Your highest-rated logs used around{' '}
            <strong className="text-inkStrong">
              {data.best_dose} {unit}
            </strong>
            .
          </p>
        </div>
      )}

      {/* ── Monthly calendar heatmap ── */}
      <MonthlyCalendar logs={remedyLogs} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RemedyStatsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [pseudonymId, setPseudonymId] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<RemedyLog[]>([]);
  const [logsReady, setLogsReady] = useState(false);
  const [personalStats, setPersonalStats] = useState<PersonalStat[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-remedy detail state
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<InsightData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const { remedies: activeRemedies, loading: arLoading } = useActiveRemedies(pseudonymId);

  // ── Load pseudonym ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('pseudonym_id')
        .eq('auth_id', user.id)
        .single();
      if (profile) setPseudonymId(profile.pseudonym_id);
    }
    init();
  }, []);

  // ── Load raw logs ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pseudonymId) return;
    loadData(pseudonymId);
  }, [pseudonymId]);

  // ── Compute personalStats when both logs and activeRemedies are ready ──────
  useEffect(() => {
    if (!logsReady || arLoading) return;
    computeStats();
  }, [allLogs, activeRemedies, arLoading, logsReady]);

  useEffect(() => {
    const name = searchParams.get('name');
    const category = searchParams.get('category');
    if (!name || !category || loading || personalStats.length === 0) return;

    const match = personalStats.find(
      stat => stat.remedy_name === name && stat.remedy_category === category
    );

    if (match) {
      loadDetail(match);
    }
  }, [searchParams, loading, personalStats]);

  async function loadData(pid: string) {
    const { data: logs } = await supabase
      .from('remedy_logs')
      .select('remedy_name, remedy_category, effectiveness, log_date')
      .eq('pseudonym_id', pid)
      .not('effectiveness', 'is', null);

    if (logs) setAllLogs(logs as RemedyLog[]);
    setLogsReady(true);

    const { data: global } = await supabase.rpc('get_global_remedy_stats');
    if (global) setGlobalStats(global as GlobalStat[]);
  }

  function computeStats() {
    const stats: PersonalStat[] = activeRemedies.map(remedy => {
      const logs = allLogs.filter(
        l => l.remedy_name === remedy.remedy_name && l.remedy_category === remedy.remedy_category
      );
      const sum = logs.reduce((s, l) => s + l.effectiveness, 0);
      const dates = logs.map(l => l.log_date).sort();
      return {
        remedy_name: remedy.remedy_name,
        remedy_category: remedy.remedy_category,
        log_count: logs.length,
        avg_effectiveness: logs.length > 0 ? Math.round((sum / logs.length) * 10) / 10 : 0,
        last_logged: dates[dates.length - 1] ?? '',
        first_logged: dates[0] ?? '',
        emoji: remedy.emoji ?? CAT_EMOJI[remedy.remedy_category] ?? '✏️',
        unit: remedy.unit ?? '',
        started_at: remedy.started_at,
        is_active: true,
      };
    });
    stats.sort((a, b) => b.avg_effectiveness - a.avg_effectiveness || b.log_count - a.log_count);
    setPersonalStats(stats);
    setLoading(false);
  }

  // ── Load per-remedy detail from backend ───────────────────────────────────
  const loadDetail = useCallback(
    async (stat: PersonalStat) => {
      const key = `${stat.remedy_name}::${stat.remedy_category}`;
      if (detailKey === key) {
        setDetailKey(null);
        setDetailData(null);
        return;
      }

      setDetailKey(key);
      setDetailData(null);
      setDetailError(null);
      setDetailLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('Not authenticated');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const url = `${apiUrl}/api/v1/remedies/insights?name=${encodeURIComponent(stat.remedy_name)}&category=${encodeURIComponent(stat.remedy_category)}`;

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const json = (await res.json()) as InsightData;
        setDetailData(json);
      } catch (e: any) {
        setDetailError(e.message ?? 'Failed to load insights');
      } finally {
        setDetailLoading(false);
      }
    },
    [detailKey, supabase]
  );

  const bestPersonal = personalStats.find(s => s.log_count >= 2) ?? personalStats[0];
  const totalLogs = personalStats.reduce((s, r) => s + r.log_count, 0);
  const activeCount = personalStats.filter(s => s.is_active).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Remedy effectiveness"
      subtitle="See which remedies are working best — for you and across the community."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-inkMuted">Loading your data…</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Summary strip ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Remedies tracked', value: personalStats.length },
              { label: 'Active in regimen', value: activeCount },
              { label: 'Total logs', value: totalLogs },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-3xl bg-bg ring-1 ring-ink/10 px-4 py-4 text-center shadow-sm"
              >
                <p className="text-2xl font-bold text-inkStrong">{value}</p>
                <p className="mt-0.5 text-xs text-inkMuted">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Best remedy highlight ── */}
          {bestPersonal && (
            <div className="rounded-3xl bg-linear-to-br from-primary/8 to-accent2/8 ring-1 ring-primary/20 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
                Your most effective remedy
              </p>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{bestPersonal.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-inkStrong truncate">
                    {bestPersonal.remedy_name}
                  </p>
                  <p className="text-sm text-inkMuted capitalize">
                    {CAT_LABEL[bestPersonal.remedy_category] ?? bestPersonal.remedy_category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-bold text-primary">
                    {bestPersonal.avg_effectiveness.toFixed(1)}
                  </p>
                  <p className="text-xs text-inkMuted">/ 10 avg</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-inkMuted">
                <span>
                  🗒 {bestPersonal.log_count} log{bestPersonal.log_count !== 1 ? 's' : ''}
                </span>
                {bestPersonal.started_at && (
                  <span>
                    📅 {daysSince(bestPersonal.started_at)} day
                    {daysSince(bestPersonal.started_at) !== 1 ? 's' : ''} in regimen
                  </span>
                )}
                <span>Last logged {bestPersonal.last_logged}</span>
              </div>
            </div>
          )}

          {/* ── Personal effectiveness list with detail expansion ── */}
          <Card
            title="All your remedies"
            description="Click 'View insights' on any remedy for a detailed breakdown."
          >
            {personalStats.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-inkMuted">No remedy logs yet.</p>
                <p className="mt-1 text-xs text-inkMuted">
                  Log remedies from the{' '}
                  <a href="/remedies" className="text-primary hover:underline">
                    Remedies page
                  </a>{' '}
                  or your daily diary to see stats here.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {personalStats.map(stat => {
                  const key = `${stat.remedy_name}::${stat.remedy_category}`;
                  const isOpen = detailKey === key;

                  return (
                    <div key={key}>
                      {/* Summary row */}
                      <div className="rounded-2xl bg-bgMuted/40 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl shrink-0">{stat.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-inkStrong truncate">
                                {stat.remedy_name}
                              </p>
                              {stat.is_active && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  Active
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] ${CAT_COLOR[stat.remedy_category] ?? 'bg-neutral-100 text-neutral-700'}`}
                              >
                                {CAT_LABEL[stat.remedy_category] ?? stat.remedy_category}
                              </span>
                            </div>
                            <div className="mt-1.5">
                              <EffBar value={stat.avg_effectiveness} />
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <EffBadge value={stat.avg_effectiveness} />
                            <button
                              type="button"
                              onClick={() => loadDetail(stat)}
                              className={[
                                'text-[11px] font-semibold rounded-full px-2.5 py-1 transition-colors',
                                isOpen
                                  ? 'bg-primary text-white'
                                  : 'bg-bgSoft ring-1 ring-ink/10 text-primary hover:bg-primary/10',
                              ].join(' ')}
                            >
                              {isOpen ? 'Close ↑' : 'View insights ↓'}
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-inkMuted">
                          {stat.started_at && <span>In regimen {daysSince(stat.started_at)}d</span>}
                          <span>
                            {stat.log_count} log{stat.log_count !== 1 ? 's' : ''}
                          </span>
                          <span>Last: {stat.last_logged}</span>
                        </div>
                      </div>

                      {/* Inline detail panel */}
                      {isOpen &&
                        (detailLoading ? (
                          <div className="mt-2 rounded-3xl bg-bgMuted/30 ring-1 ring-ink/10 px-5 py-8 text-center">
                            <p className="text-sm text-inkMuted">Computing insights…</p>
                          </div>
                        ) : detailError ? (
                          <div className="mt-2 rounded-3xl bg-red-50 ring-1 ring-red-200 px-5 py-4">
                            <p className="text-sm text-red-700">
                              Could not load insights: {detailError}
                            </p>
                            <p className="mt-1 text-xs text-red-500">
                              Make sure the backend server is running.
                            </p>
                          </div>
                        ) : detailData ? (
                          <DetailPanel
                            data={detailData}
                            emoji={stat.emoji}
                            unit={stat.unit}
                            remedyLogs={allLogs.filter(
                              l =>
                                l.remedy_name === stat.remedy_name &&
                                l.remedy_category === stat.remedy_category
                            )}
                            onClose={() => {
                              setDetailKey(null);
                              setDetailData(null);
                            }}
                          />
                        ) : null)}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── Community insights ── */}
          <Card
            title="Community insights"
            description="Average effectiveness across all users (only shown when ≥ 2 users have logged the same remedy)."
          >
            {globalStats.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-inkMuted">Not enough community data yet.</p>
                <p className="mt-1 text-xs text-inkMuted">
                  Community stats appear once multiple users have logged the same remedies.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {globalStats.map((g, idx) => (
                  <div
                    key={`${g.remedy_name}::${g.remedy_category}`}
                    className="flex items-center gap-3 rounded-2xl bg-bgMuted/40 px-4 py-3"
                  >
                    <span className="text-xs font-bold text-inkMuted w-5 shrink-0">#{idx + 1}</span>
                    <span className="text-lg shrink-0">{CAT_EMOJI[g.remedy_category] ?? '✏️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-inkStrong truncate">{g.remedy_name}</p>
                      <div className="mt-1">
                        <EffBar value={g.avg_effectiveness} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <EffBadge value={g.avg_effectiveness} />
                      <p className="mt-1 text-[10px] text-inkMuted">
                        {g.user_count} user{g.user_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
