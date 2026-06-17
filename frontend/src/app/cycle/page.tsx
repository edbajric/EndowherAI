"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  useCycles,
  getDayStatus,
  findActiveCycle,
  toDateKey,
  parseDateKey,
  addDaysToKey,
  type Cycle,
  type CycleSettings,
} from "@/lib/cycles";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMonthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const days: Date[] = [];
  const cur = new Date(start);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function fmtDate(key: string, opts?: Intl.DateTimeFormatOptions) {
  // Use "en" to avoid server/client locale mismatch during hydration
  return parseDateKey(key).toLocaleDateString("en", opts ?? { month: "short", day: "numeric" });
}

// ─── Mini cycle strip shown in the Today sidebar card ────────────────────────

function CycleStrip({
  cycles,
  settings,
  todayKey,
}: {
  cycles: Cycle[];
  settings: CycleSettings | null;
  todayKey: string;
}) {
  const activeCycle   = findActiveCycle(todayKey, cycles, settings);
  const cycleStart    = activeCycle?.start_date ?? null;
  const todayStatus   = getDayStatus(todayKey, cycles, settings);
  const cycleLen      = activeCycle
    ? (activeCycle.cycle_length ?? settings?.avg_cycle_length ?? 28)
    : (settings?.avg_cycle_length ?? 28);

  if (!cycleStart) {
    return (
      <p className="text-xs text-inkMuted">
        Log a period start to see your cycle here.
      </p>
    );
  }

  const days = Array.from({ length: cycleLen }, (_, i) => i + 1);

  return (
    <div>
      <p className="mb-2 text-xs text-inkMuted">
        Day{" "}
        <span className="font-semibold text-inkStrong">{todayStatus.cycleDay}</span>
        {" "}of {cycleLen} · started {fmtDate(cycleStart)}
      </p>
      <div className="flex flex-wrap gap-1">
        {days.map((d) => {
          const dayKey = addDaysToKey(cycleStart, d - 1);
          const s      = getDayStatus(dayKey, cycles, settings);
          const isNow  = d === todayStatus.cycleDay;

          let cls = "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ";
          if (isNow)                              cls += "ring-2 ring-offset-1 ring-inkStrong ";
          if (s.isPeriod && !s.isPredicted)       cls += "bg-pink-600 text-white ";
          else if (s.isPeriod && s.isPredicted)   cls += "bg-pink-200 text-pink-800 ";
          else if (s.isOvulation)                 cls += "bg-accent2/20 ring-1 ring-accent2 text-inkStrong ";
          else if (s.isFertileWindow)             cls += "bg-accent2/10 text-inkStrong ";
          else                                    cls += "bg-bgMuted text-inkMuted ";

          return (
            <div key={d} className={cls} title={`Day ${d} — ${dayKey}`}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CyclePage() {
  const supabase = createClient();

  const [pseudonymId,    setPseudonymId]    = useState<string | null>(null);
  // monthAnchor and todayKey are initialised after mount to avoid server/client
  // timezone mismatch (Next.js SSRs 'use client' components with the server clock).
  const [monthAnchor,    setMonthAnchor]    = useState(() => new Date());
  const [todayKey,       setTodayKey]       = useState("");
  const [selectedDate,   setSelectedDate]   = useState<string | null>(null);
  const [loggingDate,    setLoggingDate]    = useState(false);
  const [logError,       setLogError]       = useState<string | null>(null);
  const [showSettings,   setShowSettings]   = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError,  setSettingsError]  = useState<string | null>(null);
  const [cycleLenStr,    setCycleLenStr]    = useState("28");
  const [periodLenStr,   setPeriodLenStr]   = useState("5");

  const {
    cycles, settings, loading,
    saveSettings, logPeriodStart, updatePeriodLength, deleteCycle,
  } = useCycles(pseudonymId);

  // Set client-side date after hydration to avoid server/client timezone mismatch
  useEffect(() => {
    const now = new Date();
    setTodayKey(toDateKey(now));
    setMonthAnchor(now);
  }, []);

  // Resolve pseudonymId from user_profiles (same pattern as diary page)
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("pseudonym_id")
        .eq("auth_id", user.id)
        .single();
      if (profile) setPseudonymId(profile.pseudonym_id);
    }
    init();
  }, []);

  // Sync settings input strings when settings load from DB
  useEffect(() => {
    if (settings) {
      setCycleLenStr(String(settings.avg_cycle_length));
      setPeriodLenStr(String(settings.avg_period_length));
    }
  }, [settings]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  // todayKey is set from useEffect above (client-side only) to avoid hydration mismatch.
  const monthDays   = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const monthLabel  = `${MONTH_NAMES[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`; // static, no locale call
  const activeCycle = useMemo(() => findActiveCycle(todayKey, cycles, settings), [cycles, settings, todayKey]);
  const todayStatus = useMemo(() => getDayStatus(todayKey, cycles, settings), [cycles, settings, todayKey]);

  // Cycle that owns the selected date (if a logged one exists there)
  const selectedCycle = useMemo(
    () => (selectedDate ? findActiveCycle(selectedDate, cycles, settings) : null),
    [selectedDate, cycles, settings],
  );

  // Preview: days that would become period days if user logs selectedDate as start
  const previewPeriodLen = Math.max(1, parseInt(periodLenStr, 10) || settings?.avg_period_length || 5);
  const previewKeys = useMemo((): Set<string> => {
    if (!selectedDate || selectedCycle) return new Set();
    const s = new Set<string>();
    for (let i = 0; i < previewPeriodLen; i++) s.add(addDaysToKey(selectedDate, i));
    return s;
  }, [selectedDate, selectedCycle, previewPeriodLen]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleCellClick(key: string) {
    setLogError(null);
    setSelectedDate((prev) => (prev === key ? null : key));
  }

  async function handleLogDate(dateKey: string) {
    if (!pseudonymId) { setLogError("Still loading your profile. Please wait."); return; }
    setLogError(null);
    setLoggingDate(true);
    const { error } = await logPeriodStart(dateKey, previewPeriodLen);
    setLoggingDate(false);
    if (error) {
      setLogError(error.includes("duplicate") || error.includes("unique")
        ? "A cycle is already logged starting on that date."
        : error);
    } else {
      setSelectedDate(null);
    }
  }

  async function handleSaveSettings() {
    setSettingsError(null);
    const cycleLen  = parseInt(cycleLenStr, 10);
    const periodLen = parseInt(periodLenStr, 10);
    if (!cycleLen  || cycleLen  < 15 || cycleLen  > 60) { setSettingsError("Cycle length must be 15–60 days."); return; }
    if (!periodLen || periodLen < 1  || periodLen > 14) { setSettingsError("Period length must be 1–14 days."); return; }
    setSavingSettings(true);
    const err = await saveSettings({
      avg_cycle_length:    cycleLen,
      avg_period_length:   periodLen,
      luteal_phase_length: settings?.luteal_phase_length ?? 14,
    });
    setSavingSettings(false);
    if (err) { setSettingsError(err); return; }
    setShowSettings(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Cycle"
      subtitle="Track your period, see predicted ovulation, and log when a new cycle starts."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        {/* ── Main calendar ── */}
        <Card>
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
              ‹ Prev
            </Button>
            <h2 className="text-lg font-semibold text-inkStrong">{monthLabel}</h2>
            <Button variant="ghost" onClick={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
              Next ›
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="py-1 text-xs font-medium text-inkMuted">{w}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((day, i) => {
              const key      = toDateKey(day);
              const inMonth  = day.getMonth() === monthAnchor.getMonth();
              const isToday  = key === todayKey;
              const isSelected = key === selectedDate;
              // Guard isFuture until todayKey is set client-side — prevents all days
              // appearing as "future" on first render when todayKey is still "".
              const isFuture = todayKey !== "" && key > todayKey;
              const status   = getDayStatus(key, cycles, settings);
              const isPreview = previewKeys.has(key) && !status.isPeriod;

              // ── Determine cell color ──────────────────────────────────────
              let bg     = "";
              let fg     = inMonth ? "text-inkStrong" : "text-inkMuted/30";
              let fw     = "";
              let border = "";  // dashed border for ovulation (separate from today dot)

              if (isSelected) {
                bg = "bg-pink-500"; fg = "text-white"; fw = "font-bold";
              } else if (isPreview) {
                bg = isFuture ? "bg-pink-200" : "bg-pink-300"; fg = "text-pink-900";
              } else if (status.isPeriod && !status.isPredicted) {
                // Logged period day
                bg = isToday ? "bg-red-600" : "bg-pink-600";
                fg = "text-white"; fw = "font-semibold";
              } else if (status.isPeriod && status.isPredicted) {
                // Predicted period start day (one dot only)
                bg = isFuture ? "bg-pink-100" : "bg-pink-300";
                fg = isFuture ? "text-pink-700" : "text-pink-900";
              } else if (status.isOvulation) {
                // Dashed outline for all ovulation days (predicted or logged)
                border = "border-2 border-dashed border-accent2";
              }
              // Fertile window NOT coloured — showing it caused user confusion ("greyish days")

              // Today: small absolute dot — more reliable than ring-inset in Tailwind v4.
              // Only render after todayKey is set (client-side) to avoid hydration mismatch.
              const showTodayDot = isToday && !isSelected && todayKey !== "";

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCellClick(key)}
                  className={[
                    "relative flex h-10 sm:h-12 w-full flex-col items-center justify-center",
                    "rounded-xl text-xs sm:text-sm transition-all",
                    "hover:opacity-80 active:scale-95",
                    bg, fg, fw, border,
                  ].filter(Boolean).join(" ")}
                >
                  <span className={isToday && !isSelected ? "font-bold" : ""}>{day.getDate()}</span>
                  {showTodayDot && (
                    <span
                      className={[
                        "absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                        status.isPeriod || isPreview ? "bg-white" : "bg-primary",
                      ].join(" ")}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected date action panel */}
          {selectedDate && (
            <div className="mt-4 rounded-2xl bg-pink-50 ring-1 ring-pink-200 px-4 py-4 space-y-3">
              <p className="text-sm font-semibold text-inkStrong">
                {fmtDate(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>

              {selectedCycle ? (
                // This date already belongs to a logged cycle
                <>
                  <p className="text-xs text-inkMuted">
                    Part of a cycle starting {fmtDate(selectedCycle.start_date)} ·{" "}
                    period is <span className="font-medium text-inkStrong">{selectedCycle.period_length} days</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updatePeriodLength(selectedCycle.id, Math.min(14, selectedCycle.period_length + 1))}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-inkStrong ring-1 ring-ink/15 hover:bg-bgSoft"
                    >
                      Period +1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePeriodLength(selectedCycle.id, Math.max(1, selectedCycle.period_length - 1))}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-inkStrong ring-1 ring-ink/15 hover:bg-bgSoft"
                    >
                      Period −1 day
                    </button>
                    <button
                      type="button"
                      onClick={async () => { await deleteCycle(selectedCycle.id); setSelectedDate(null); }}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                    >
                      Delete cycle
                    </button>
                  </div>
                </>
              ) : (
                // No cycle here — offer to log period start
                <>
                  <p className="text-xs text-inkMuted">
                    Logging here will mark the following{" "}
                    <span className="font-medium text-inkStrong">{previewPeriodLen} days</span>{" "}
                    as period days (shown in lighter pink above).
                  </p>
                  {logError && <p className="text-xs text-red-600">{logError}</p>}
                  <Button
                    onClick={() => handleLogDate(selectedDate)}
                    disabled={loggingDate || !pseudonymId}
                  >
                    {loggingDate ? "Logging…" : `Log period start — ${fmtDate(selectedDate)}`}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-inkMuted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-pink-600" /> Period
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-red-600" /> Period · today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-pink-100" /> Next period (predicted)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-accent2" /> Ovulation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-pink-300" /> Preview on click
            </span>
          </div>
        </Card>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-6">

          {/* Today card with cycle day + mini strip */}
          <Card title="Today">
            <div className="mt-3 space-y-4">
              {todayStatus.cycleDay ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-inkStrong">{todayStatus.cycleDay}</span>
                  <span className="text-sm text-inkMuted">
                    of ~{settings?.avg_cycle_length ?? 28} days
                  </span>
                </div>
              ) : (
                <p className="text-sm text-inkMuted">No active cycle.</p>
              )}

              {activeCycle && (
                <div className="space-y-2">
                  <p className="text-xs text-inkMuted">
                    Started {fmtDate(activeCycle.start_date, { month: "long", day: "numeric" })} ·{" "}
                    period{" "}
                    <span className="font-medium text-inkStrong">{activeCycle.period_length} days</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updatePeriodLength(activeCycle.id, Math.max(1, activeCycle.period_length - 1))}
                      className="rounded-full bg-bgMuted px-3 py-1.5 text-xs font-medium text-inkStrong ring-1 ring-ink/10 hover:bg-bgSoft"
                    >
                      Period −1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePeriodLength(activeCycle.id, Math.min(14, activeCycle.period_length + 1))}
                      className="rounded-full bg-bgMuted px-3 py-1.5 text-xs font-medium text-inkStrong ring-1 ring-ink/10 hover:bg-bgSoft"
                    >
                      Period +1 day
                    </button>
                  </div>
                </div>
              )}

              {!activeCycle && !loading && (
                <div className="space-y-2">
                  {logError && <p className="text-xs text-red-600">{logError}</p>}
                  <Button
                    fullWidth
                    onClick={() => handleLogDate(todayKey)}
                    disabled={loggingDate || !pseudonymId}
                  >
                    {loggingDate ? "Logging…" : "My period started today"}
                  </Button>
                </div>
              )}

              {loading && !pseudonymId && (
                <p className="text-xs text-inkMuted">Loading…</p>
              )}
            </div>

            {/* Mini cycle strip */}
            <div className="mt-5 border-t border-ink/10 pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-inkMuted">
                Current cycle
              </p>
              <CycleStrip cycles={cycles} settings={settings} todayKey={todayKey} />
            </div>
          </Card>

          {/* Settings card */}
          <Card title="Settings">
            {!showSettings ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-inkMuted">
                  Cycle length:{" "}
                  <span className="font-semibold text-inkStrong">{settings?.avg_cycle_length ?? 28} days</span>
                </p>
                <p className="text-sm text-inkMuted">
                  Period length:{" "}
                  <span className="font-semibold text-inkStrong">{settings?.avg_period_length ?? 5} days</span>
                </p>
                <Button variant="secondary" fullWidth onClick={() => setShowSettings(true)}>
                  Edit
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-4">
                <div>
                  <label className="text-sm font-medium text-inkStrong">
                    Cycle length <span className="text-xs font-normal text-inkMuted">(15–60 days)</span>
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={60}
                    value={cycleLenStr}
                    onChange={(e) => setCycleLenStr(e.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-inkStrong">
                    Period length <span className="text-xs font-normal text-inkMuted">(1–14 days)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={periodLenStr}
                    onChange={(e) => setPeriodLenStr(e.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                  />
                </div>
                {settingsError && (
                  <p className="text-sm text-red-600">{settingsError}</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSaveSettings} disabled={savingSettings || !pseudonymId}>
                    {savingSettings ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowSettings(false); setSettingsError(null); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
