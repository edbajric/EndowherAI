'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommunityData {
  sample_size: number;
  condition_breakdown: { endo_only: number; pcos_only: number; both: number };
  remedy_effectiveness: { label: string; category: string; avg_effectiveness: number; usage_pct: number }[];
  symptom_prevalence: { endo: { label: string; avg_score: number }[] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  tea: '🍵', supplement: '💊', exercise: '🏃', heat: '🌡️',
  diet: '🥗', meditation: '🧘', medication: '💉', other: '✏️',
};

function effColor(v: number) {
  if (v >= 7) return 'text-green-700';
  if (v >= 5) return 'text-amber-600';
  return 'text-red-600';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [data, setData] = useState<CommunityData | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    fetch(`${apiUrl}/api/v1/insights/community`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => null);
  }, []);

  const topRemedies = data?.remedy_effectiveness.slice(0, 5) ?? [];
  const topSymptoms = data?.symptom_prevalence.endo.slice(0, 4) ?? [];

  return (
    <PageShell
      title="Insights"
      subtitle="Research findings, personal trends, and community data."
    >
      <div className="space-y-5">
        {/* ── Quick-nav cards ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/insights/remedies"
            className="group rounded-3xl bg-linear-to-br from-primary/8 to-accent2/8 ring-1 ring-primary/20 px-6 py-5 hover:ring-primary/40 transition-all"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
              My remedies
            </p>
            <p className="text-lg font-bold text-inkStrong group-hover:text-primary transition-colors">
              Effectiveness stats →
            </p>
            <p className="mt-1 text-sm text-inkMuted">
              Trends, pain correlation, consistency and community rankings for each remedy.
            </p>
          </Link>

          <Link
            href="/insights/data"
            className="group rounded-3xl bg-linear-to-br from-cyan-500/8 to-emerald-500/8 ring-1 ring-cyan-500/20 px-6 py-5 hover:ring-cyan-500/40 transition-all"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 mb-1">
              Research data
            </p>
            <p className="text-lg font-bold text-inkStrong group-hover:text-cyan-700 transition-colors">
              Symptom & remedy patterns →
            </p>
            <p className="mt-1 text-sm text-inkMuted">
              Symptom prevalence by condition, remedy effectiveness from {data ? data.sample_size : '…'} survey respondents.
            </p>
          </Link>
        </div>

        {/* ── Research snapshot (live from backend) ── */}
        {data && (
          <>
            {/* Condition breakdown */}
            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-5 shadow-sm">
              <p className="text-xs font-semibold text-inkStrong mb-3">Survey respondents</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-violet-50 ring-1 ring-violet-200 px-3 py-3">
                  <p className="text-xl font-bold text-violet-700">{data.condition_breakdown.endo_only}</p>
                  <p className="text-[10px] text-violet-600 font-medium mt-0.5">Endo only</p>
                </div>
                <div className="rounded-2xl bg-cyan-50 ring-1 ring-cyan-200 px-3 py-3">
                  <p className="text-xl font-bold text-cyan-700">{data.condition_breakdown.pcos_only}</p>
                  <p className="text-[10px] text-cyan-600 font-medium mt-0.5">PCOS only</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 px-3 py-3">
                  <p className="text-xl font-bold text-emerald-700">{data.condition_breakdown.both}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Both</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Top remedies */}
              <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-inkStrong">Top remedies (research)</p>
                  <Link href="/insights/data" className="text-[11px] text-primary hover:underline">
                    See all →
                  </Link>
                </div>
                <div className="space-y-2">
                  {topRemedies.map((r, i) => (
                    <div key={r.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-inkMuted w-3">{i + 1}</span>
                      <span className="text-sm">{CAT_EMOJI[r.category] ?? '✏️'}</span>
                      <p className="flex-1 text-xs text-inkStrong truncate">{r.label}</p>
                      <span className={`text-xs font-bold ${effColor(r.avg_effectiveness)}`}>
                        {r.avg_effectiveness.toFixed(1)}/10
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top endo symptoms */}
              <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-inkStrong">Top endo symptoms</p>
                  <Link href="/insights/data" className="text-[11px] text-primary hover:underline">
                    Full chart →
                  </Link>
                </div>
                <div className="space-y-2">
                  {topSymptoms.map((s, i) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-inkMuted w-3">{i + 1}</span>
                      <p className="flex-1 text-xs text-inkStrong truncate">{s.label}</p>
                      <div className="w-16 h-1.5 rounded-full bg-ink/8 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-violet-400"
                          style={{ width: `${(s.avg_score / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-inkMuted w-5 text-right">{s.avg_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
