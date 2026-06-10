'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { PageShell } from '@/components/layout/PageShell';
import { useActiveRemedies } from '@/lib/active-remedies';

// ─── Catalogue ────────────────────────────────────────────────────────────────

interface CategoryDef {
  label: string;
  emoji: string;
  color: string;
  unit: string;
  remedies: string[];
}

const CATALOGUE: Record<string, CategoryDef> = {
  tea: {
    label: 'Herbal Tea',
    emoji: '🍵',
    color: 'bg-amber-100 text-amber-800',
    unit: 'ml',
    remedies: [
      'Chamomile (Kamilica)',
      'Ginger (Đumbir)',
      'Cinnamon (Cimet)',
      'Spearmint (Zelena metvica)',
      'Peppermint (Nana/Menta)',
      'Raspberry leaf (List maline)',
      'Fennel (Komorač)',
      'Turmeric (Kurkuma)',
      'Parsley (Peršun)',
      'Valeriana officinalis (Macina trava)',
      'Marigold (Neven)',
      "St John's wort (Kantarion)",
      'Yarrow / Achillea millefolium',
      'Sage / Salvia officinalis (Kadulja)',
      'Rosemary (Ruzmarin)',
      'Geranium (Zdravca)',
      'Elderflower (Zova)',
      'Other tea',
    ],
  },
  supplement: {
    label: 'Supplement',
    emoji: '💊',
    color: 'bg-violet-100 text-violet-800',
    unit: 'tablet(s)',
    remedies: [
      'Myo-inositol',
      'D-chiro-inositol',
      'Berberine',
      'N-acetylcysteine (NAC)',
      'Magnesium',
      'Zinc',
      'Vitamin D',
      'Omega-3 / Fish oil',
      'Other supplement',
    ],
  },
  exercise: {
    label: 'Exercise',
    emoji: '🏃',
    color: 'bg-green-100 text-green-800',
    unit: 'min',
    remedies: [
      'Gentle stretching / mobility',
      'Yoga or Pilates',
      'Walking',
      'Running or jogging',
      'Weight training',
      'Cardio',
      'Swimming / water exercise',
      'Pelvic floor / physiotherapy',
      'Other exercise',
    ],
  },
  heat: {
    label: 'Heat Therapy',
    emoji: '🌡️',
    color: 'bg-red-100 text-red-800',
    unit: 'min',
    remedies: [
      'Heating pad / electric blanket',
      'Hot water bottle',
      'Warm bath / shower',
      'Castor oil heat pack',
      'Other heat therapy',
    ],
  },
  diet: {
    label: 'Diet Change',
    emoji: '🥗',
    color: 'bg-lime-100 text-lime-800',
    unit: 'serving(s)',
    remedies: [
      'Anti-inflammatory diet',
      'Reduced sugar / sweets',
      'Reduced processed / fast food',
      'Higher protein meals',
      'Lower-carb meals',
      'Reduced gluten',
      'Reduced dairy',
      'Vegetarian / vegan',
      'Intermittent fasting',
      'Keto',
      'Other dietary change',
    ],
  },
  meditation: {
    label: 'Meditation',
    emoji: '🧘',
    color: 'bg-sky-100 text-sky-800',
    unit: 'min',
    remedies: [
      'Breathwork (e.g. box breathing)',
      'Guided meditation',
      'Body scan relaxation',
      'Mindfulness',
      'Progressive muscle relaxation',
      'Journalling',
      'Other meditation / breathing',
    ],
  },
  medication: {
    label: 'Medication',
    emoji: '💉',
    color: 'bg-pink-100 text-pink-800',
    unit: 'dose(s)',
    remedies: [
      'Ibuprofen / Naproxen',
      'Paracetamol / Acetaminophen',
      'Combined oral contraceptive',
      'Progestogen-only pill',
      'Hormonal IUD',
      'GnRH agonist',
      'Other prescribed medication',
    ],
  },
  other: {
    label: 'Other',
    emoji: '✏️',
    color: 'bg-neutral-100 text-neutral-700',
    unit: '',
    remedies: [],
  },
};

const CATEGORY_ORDER = [
  'tea', 'supplement', 'exercise', 'heat', 'diet', 'meditation', 'medication', 'other',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface RemedyStat {
  count: number;
  avg: number;
  last: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function EffDot({ value }: { value: number }) {
  const color = value >= 7 ? 'bg-green-400' : value >= 4 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RemediesPage() {
  const supabase = createClient();
  const [pseudonymId, setPseudonymId] = useState<string | null>(null);
  const [logStats, setLogStats] = useState<Map<string, RemedyStat>>(new Map());
  const [browseCat, setBrowseCat] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  const { remedies: activeRemedies, loading: arLoading, add, remove, isActive } = useActiveRemedies(pseudonymId);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
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

  // ── Log stats per remedy ──────────────────────────────────────────────────────
  const loadStats = useCallback(async (pid: string) => {
    const { data } = await supabase
      .from('remedy_logs')
      .select('remedy_name, remedy_category, effectiveness, log_date')
      .eq('pseudonym_id', pid)
      .not('effectiveness', 'is', null);

    if (!data) return;

    const acc = new Map<string, { count: number; sum: number; last: string }>();
    for (const log of data) {
      const key = `${log.remedy_name}::${log.remedy_category}`;
      const ex = acc.get(key);
      if (!ex) {
        acc.set(key, { count: 1, sum: log.effectiveness, last: log.log_date });
      } else {
        ex.count++;
        ex.sum += log.effectiveness;
        if (log.log_date > ex.last) ex.last = log.log_date;
      }
    }

    const result = new Map<string, RemedyStat>();
    for (const [key, v] of acc) {
      result.set(key, { count: v.count, avg: Math.round((v.sum / v.count) * 10) / 10, last: v.last });
    }
    setLogStats(result);
  }, []);

  useEffect(() => {
    if (!pseudonymId) return;
    loadStats(pseudonymId);
  }, [pseudonymId, activeRemedies]);

  // ── Add to regimen ────────────────────────────────────────────────────────────
  async function handleAdd(name: string, cat: string) {
    const catDef = CATALOGUE[cat];
    const key = `${name}::${cat}`;
    setAddingKey(key);
    await add({ remedy_name: name, remedy_category: cat, emoji: catDef.emoji, unit: catDef.unit });
    setAddingKey(null);
  }

  async function handleAddCustom() {
    if (!browseCat || !customName.trim()) return;
    await handleAdd(customName.trim(), browseCat);
    setCustomName('');
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="My Remedy Regimen"
      subtitle="Manage which remedies you're tracking. Log your daily use from the Diary page."
    >
      {/* ── Currently tracking ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-inkStrong">
            Currently tracking
            {activeRemedies.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {activeRemedies.length}
              </span>
            )}
          </h2>
          {activeRemedies.length > 0 && (
            <Link
              href="/insights/remedies"
              className="text-xs font-medium text-primary hover:underline"
            >
              View effectiveness stats →
            </Link>
          )}
        </div>

        {arLoading ? (
          <p className="text-sm text-inkMuted">Loading…</p>
        ) : activeRemedies.length === 0 ? (
          <div className="rounded-3xl bg-bgMuted/40 px-6 py-10 text-center">
            <p className="text-2xl mb-2">🌿</p>
            <p className="text-sm font-medium text-inkStrong">No remedies tracked yet</p>
            <p className="mt-1 text-xs text-inkMuted">
              Browse the catalogue below and tap a remedy to start tracking it.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeRemedies.map(remedy => {
              const catDef = CATALOGUE[remedy.remedy_category] ?? CATALOGUE.other;
              const key = `${remedy.remedy_name}::${remedy.remedy_category}`;
              const stats = logStats.get(key);
              const days = daysSince(remedy.started_at);

              return (
                <div
                  key={remedy.id}
                  className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4 shadow-sm flex flex-col gap-3"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{remedy.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-inkStrong truncate">
                          {remedy.remedy_name}
                        </p>
                        <span
                          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${catDef.color}`}
                        >
                          {catDef.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(remedy.id)}
                      title="Stop tracking this remedy"
                      className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink/6 text-inkMuted hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <svg viewBox="0 0 14 14" width="10" height="10" fill="none" aria-hidden>
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-inkMuted">
                    <span>📅 {days}d in regimen</span>
                    {stats ? (
                      <>
                        <span className="flex items-center gap-1">
                          <EffDot value={stats.avg} />
                          {stats.avg}/10 avg
                        </span>
                        <span>🗒 {stats.count} log{stats.count !== 1 ? 's' : ''}</span>
                        <span>Last: {stats.last}</span>
                      </>
                    ) : (
                      <span className="italic">No logs yet — use the Diary to log daily</span>
                    )}
                  </div>

                  {/* Action links */}
                  <div className="flex items-center gap-3 pt-1 border-t border-ink/6">
                    <Link
                      href={`/insights/remedies?name=${encodeURIComponent(remedy.remedy_name)}&category=${encodeURIComponent(remedy.remedy_category)}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View insights →
                    </Link>
                    <Link
                      href="/diary"
                      className="text-xs text-inkMuted hover:text-inkStrong hover:underline"
                    >
                      Log in diary →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Add to regimen ── */}
      <section className="space-y-4 mt-8">
        <h2 className="text-sm font-semibold text-inkStrong">Add to your regimen</h2>
        <p className="text-xs text-inkMuted">
          Select a category, then tap a remedy to start tracking it. It will appear in your daily diary for quick logging.
        </p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map(cat => {
            const c = CATALOGUE[cat];
            const active = browseCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setBrowseCat(active ? null : cat)}
                className={[
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary text-white'
                    : 'bg-bg ring-1 ring-ink/10 text-inkStrong hover:bg-bgSoft',
                ].join(' ')}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Remedy pills */}
        {browseCat && (
          <div className="rounded-3xl bg-bgMuted/30 ring-1 ring-ink/8 px-4 py-4 space-y-3">
            {CATALOGUE[browseCat].remedies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {CATALOGUE[browseCat].remedies.map(name => {
                  const active = isActive(name, browseCat);
                  const loading = addingKey === `${name}::${browseCat}`;
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={active || loading}
                      onClick={() => !active && !loading && handleAdd(name, browseCat)}
                      className={[
                        'rounded-full px-3 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/30 cursor-default'
                          : loading
                            ? 'bg-bgMuted text-inkMuted cursor-wait'
                            : 'bg-bg ring-1 ring-ink/10 text-inkStrong hover:bg-primary/8 hover:ring-primary/30 hover:text-primary',
                      ].join(' ')}
                    >
                      {active ? '✓ ' : loading ? '…' : '+ '}
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Custom entry for anything not in the list */}
            {(
              <div className="flex gap-2 items-center pt-1 border-t border-ink/8">
                <input
                  type="text"
                  placeholder={`Custom ${CATALOGUE[browseCat].label.toLowerCase()} name…`}
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  className="flex-1 h-9 rounded-2xl bg-bg px-3 ring-1 ring-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent2"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={!customName.trim()}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
