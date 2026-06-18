/**
 * Period / cycle tracking — backed by Supabase `cycles` and `cycle_settings`.
 *
 * Each row in `cycles` represents one logged period (start date + actual
 * period length for that cycle). `cycle_settings` holds the user's typical
 * cycle/period length, used to project upcoming cycles before/between
 * logged history.
 *
 * Used by:
 *  - /cycle   → calendar view, settings, log/edit period
 *  - /diary   → auto-derive cycle day for today from the active cycle
 */

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

// ─── Types mirror the DB tables (snake_case) ──────────────────────────────────

export interface Cycle {
  id:             string;
  pseudonym_id:   string;
  start_date:     string; // YYYY-MM-DD
  period_length:  number;
  cycle_length:   number | null;
  notes:          string | null;
  created_at:     string;
  updated_at:     string;
}

export interface CycleSettings {
  pseudonym_id:         string;
  avg_cycle_length:     number;
  avg_period_length:    number;
  luteal_phase_length:  number;
  updated_at:           string;
}

const DEFAULT_SETTINGS: Omit<CycleSettings, "pseudonym_id" | "updated_at"> = {
  avg_cycle_length:    28,
  avg_period_length:   5,
  luteal_phase_length: 14,
};

// ─── Date helpers (local-date safe, no UTC drift) ─────────────────────────────

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToKey(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

function diffDays(a: string, b: string): number {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime();
  return Math.round(ms / 86_400_000);
}

// ─── Per-day status, derived for calendar rendering + diary auto-tracking ────

export type DayStatus = {
  cycleDay:        number | null;  // 1-indexed day within its cycle
  isPeriod:        boolean;        // logged or predicted period day
  isPredicted:     boolean;        // true if this falls in a projected (not yet logged) cycle
  isOvulation:     boolean;
  isFertileWindow: boolean;        // 5 days before ovulation through ovulation day
};

/**
 * Computes day status for `dateKey` given all known cycles (sorted ascending
 * by start_date) and the user's settings. Cycles are logged history;
 * anything after the last logged start is projected forward using
 * cycle_length (or avg_cycle_length if unset).
 */
export function getDayStatus(
  dateKey: string,
  cycles: Cycle[],
  settings: CycleSettings | null,
  maxPredictedCycles = 1,  // limit how many future cycles to project forward
): DayStatus {
  const empty: DayStatus = {
    cycleDay: null, isPeriod: false, isPredicted: false,
    isOvulation: false, isFertileWindow: false,
  };
  if (!cycles.length) return empty;

  const avgCycleLen  = settings?.avg_cycle_length   ?? DEFAULT_SETTINGS.avg_cycle_length;
  const avgPeriodLen = settings?.avg_period_length  ?? DEFAULT_SETTINGS.avg_period_length;
  const lutealLen    = settings?.luteal_phase_length ?? DEFAULT_SETTINGS.luteal_phase_length;

  const sorted = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const last   = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length; i++) {
    const cur  = sorted[i];
    const next = sorted[i + 1];
    const windowLen = cur.cycle_length ?? (next ? diffDays(cur.start_date, next.start_date) : avgCycleLen);
    const windowEnd = addDaysToKey(cur.start_date, windowLen);

    if (dateKey >= cur.start_date && dateKey < windowEnd) {
      return buildStatus(dateKey, cur.start_date, cur.period_length, windowLen, lutealLen, false);
    }
  }

  // Beyond all known windows: project forward using avg cycle length
  let projStart = addDaysToKey(last.start_date, last.cycle_length ?? avgCycleLen);
  let guard = 0;
  while (dateKey >= projStart && guard < maxPredictedCycles) {
    const windowEnd = addDaysToKey(projStart, avgCycleLen);
    if (dateKey < windowEnd) {
      return buildStatus(dateKey, projStart, avgPeriodLen, avgCycleLen, lutealLen, true);
    }
    projStart = windowEnd;
    guard++;
  }

  return empty;
}

function buildStatus(
  dateKey: string,
  cycleStart: string,
  periodLen: number,
  cycleLen: number,
  lutealLen: number,
  isPredicted: boolean,
): DayStatus {
  const cycleDay     = diffDays(cycleStart, dateKey) + 1;
  const ovulationDay = cycleLen - lutealLen;
  return {
    cycleDay,
    // For predicted cycles only mark the START day so the calendar isn't cluttered
    // with light-pink spanning the entire projected period window.
    isPeriod:        isPredicted ? cycleDay === 1 : (cycleDay >= 1 && cycleDay <= periodLen),
    isPredicted,
    isOvulation:     cycleDay === ovulationDay,
    isFertileWindow: cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay,
  };
}

/** Find the logged (non-predicted) cycle whose window contains `dateKey`, if any. */
export function findActiveCycle(
  dateKey: string,
  cycles: Cycle[],
  settings: CycleSettings | null = null,
): Cycle | null {
  // Use the user's average cycle length (or the standard 28-day default) as the
  // fallback window for the last logged cycle whose cycle_length is not yet known.
  // The old fallback of 60 days caused any click within 60 days of the last period
  // start to be attributed to that cycle, which is wrong.
  const avgCycleLen = settings?.avg_cycle_length ?? DEFAULT_SETTINGS.avg_cycle_length;
  const sorted = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));
  for (let i = 0; i < sorted.length; i++) {
    const cur  = sorted[i];
    const next = sorted[i + 1];
    const windowEnd = next ? next.start_date : addDaysToKey(cur.start_date, cur.cycle_length ?? avgCycleLen);
    if (dateKey >= cur.start_date && dateKey < windowEnd) return cur;
  }
  return null;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCycles(pseudonymId: string | null) {
  const supabase = createClient();
  const [cycles,   setCycles]   = useState<Cycle[]>([]);
  const [settings, setSettings] = useState<CycleSettings | null>(null);
  const [loading,  setLoading]  = useState(false);

  const refresh = useCallback(async () => {
    if (!pseudonymId) return;
    setLoading(true);

    const [{ data: cycleRows, error: cyclesErr }, { data: settingsRow, error: settingsErr }] = await Promise.all([
      supabase
        .from("cycles")
        .select("*")
        .eq("pseudonym_id", pseudonymId)
        .order("start_date", { ascending: true }),
      supabase
        .from("cycle_settings")
        .select("*")
        .eq("pseudonym_id", pseudonymId)
        .maybeSingle(),
    ]);

    if (cyclesErr)   console.error("cycles fetch error:", cyclesErr.message);
    if (settingsErr) console.error("cycle_settings fetch error:", settingsErr.message);

    if (cycleRows) setCycles(cycleRows as Cycle[]);
    setSettings((settingsRow as CycleSettings) ?? null);
    setLoading(false);
  }, [pseudonymId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSettings = useCallback(
    async (next: Pick<CycleSettings, "avg_cycle_length" | "avg_period_length" | "luteal_phase_length">): Promise<string | null> => {
      if (!pseudonymId) return "Not logged in";
      const { data, error } = await supabase
        .from("cycle_settings")
        .upsert(
          { pseudonym_id: pseudonymId, ...next, updated_at: new Date().toISOString() },
          { onConflict: "pseudonym_id" },
        )
        .select()
        .single();
      if (error) {
        console.error("saveSettings error:", error.message);
        return error.message;
      }
      if (data) setSettings(data as CycleSettings);
      return null;
    },
    [pseudonymId],
  );

  const logPeriodStart = useCallback(
    async (startDate: string, periodLength?: number): Promise<{ cycle: Cycle | null; error: string | null }> => {
      if (!pseudonymId) return { cycle: null, error: "Not logged in" };
      const { data, error } = await supabase
        .from("cycles")
        .insert({
          pseudonym_id:  pseudonymId,
          start_date:    startDate,
          period_length: periodLength ?? settings?.avg_period_length ?? DEFAULT_SETTINGS.avg_period_length,
        })
        .select()
        .single();

      if (error) {
        console.error("logPeriodStart error:", error.message);
        return { cycle: null, error: error.message };
      }

      if (data) {
        const newCycle = { ...(data as Cycle) };

        // Find the cycles immediately before and after the new start date (chronologically).
        // This matters when the user backdates a period — we must use the date-ordered
        // neighbours, not just the "last" cycle in the existing array.
        const sorted = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));
        const prevChron = [...sorted].reverse().find((c) => c.start_date < startDate) ?? null;
        const nextChron = sorted.find((c) => c.start_date > startDate) ?? null;

        // ① Backfill cycle_length on the new cycle itself if we know when the next one starts
        if (nextChron) {
          const len = diffDays(startDate, nextChron.start_date);
          if (len >= 15 && len <= 60) {
            const { error: e } = await supabase.from("cycles").update({ cycle_length: len }).eq("id", newCycle.id);
            if (!e) newCycle.cycle_length = len;
          }
        }

        // ② Backfill cycle_length on the preceding cycle now that we know its "next" start
        let updatedPrev: Cycle | null = null;
        if (prevChron && !prevChron.cycle_length) {
          const len = diffDays(prevChron.start_date, startDate);
          if (len >= 15 && len <= 60) {
            const { error: e } = await supabase.from("cycles").update({ cycle_length: len }).eq("id", prevChron.id);
            if (!e) updatedPrev = { ...prevChron, cycle_length: len };
          }
        }

        setCycles((prev) => {
          const withNew = [...prev, newCycle];
          return withNew
            .map((c) => (updatedPrev && c.id === updatedPrev.id ? updatedPrev : c))
            .sort((a, b) => a.start_date.localeCompare(b.start_date));
        });

        return { cycle: newCycle, error: null };
      }

      return { cycle: null, error: "Unknown error" };
    },
    [pseudonymId, cycles, settings],
  );

  const updatePeriodLength = useCallback(
    async (cycleId: string, periodLength: number) => {
      const { error } = await supabase
        .from("cycles")
        .update({ period_length: periodLength })
        .eq("id", cycleId);
      if (error) {
        console.error("updatePeriodLength error:", error.message);
        return;
      }
      setCycles((prev) => prev.map((c) => (c.id === cycleId ? { ...c, period_length: periodLength } : c)));
    },
    [],
  );

  const deleteCycle = useCallback(
    async (cycleId: string) => {
      const { error } = await supabase.from("cycles").delete().eq("id", cycleId);
      if (error) {
        console.error("deleteCycle error:", error.message);
        return;
      }
      setCycles((prev) => prev.filter((c) => c.id !== cycleId));
    },
    [],
  );

  return { cycles, settings, loading, refresh, saveSettings, logPeriodStart, updatePeriodLength, deleteCycle };
}
