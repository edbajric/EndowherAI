"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [weeklyLog, setWeeklyLog] = useState<any>(null);
  const [lastRemedy, setLastRemedy] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentRemedies, setRecentRemedies] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    avgPain: 0,
    avgFatigue: 0,
    mostCommonMood: "—",
    totalRemedies: 0,
    totalWeekly: 0,
    streak: 0,
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("pseudonym_id")
        .eq("auth_id", user.id)
        .single();

      if (!profile) { setLoading(false); return; }

      const pid = profile.pseudonym_id;
      const today = new Date().toISOString().split("T")[0];

      // Today's log
      const { data: todayData } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("pseudonym_id", pid)
        .eq("log_date", today)
        .limit(1)
        .single();
      if (todayData) setTodayLog(todayData);

      // All symptom logs
      const { data: allLogs } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("pseudonym_id", pid)
        .order("log_date", { ascending: false });

      if (allLogs && allLogs.length > 0) {
        const totalLogs = allLogs.length;
        const avgPain = Math.round((allLogs.reduce((s, l) => s + (l.pain_level || 0), 0) / totalLogs) * 10) / 10;
        const avgFatigue = Math.round((allLogs.reduce((s, l) => s + (l.fatigue_level || 0), 0) / totalLogs) * 10) / 10;

        const moodCounts: Record<string, number> = {};
        allLogs.forEach((l) => { if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; });
        const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

        let streak = 0;
        const todayDate = new Date();
        for (let i = 0; i < allLogs.length; i++) {
          const expected = new Date(todayDate);
          expected.setDate(expected.getDate() - i);
          if (allLogs[i].log_date === expected.toISOString().split("T")[0]) streak++;
          else break;
        }

        setStats((s) => ({ ...s, totalLogs, avgPain, avgFatigue, mostCommonMood, streak }));
        setRecentLogs(allLogs.slice(0, 10));
      }

      // Weekly log
      const { data: weeklyData } = await supabase
        .from("weekly_logs")
        .select("*")
        .eq("pseudonym_id", pid)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();
      if (weeklyData) setWeeklyLog(weeklyData);

      // Weekly count
      const { count: weeklyCount } = await supabase
        .from("weekly_logs")
        .select("*", { count: "exact", head: true })
        .eq("pseudonym_id", pid);
      if (weeklyCount != null) setStats((s) => ({ ...s, totalWeekly: weeklyCount }));

      // Remedies
      const { data: remedies } = await supabase
        .from("remedy_logs")
        .select("*")
        .eq("pseudonym_id", pid)
        .order("log_date", { ascending: false });
      if (remedies) {
        setStats((s) => ({ ...s, totalRemedies: remedies.length }));
        setRecentRemedies(remedies.slice(0, 5));
        if (remedies.length > 0) setLastRemedy(remedies[0]);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <PageShell title="Home" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primaryLight border-t-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Welcome back" subtitle="Your health snapshot and history.">

      {/* ===== STATS ROW ===== */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-accent px-5 py-4 text-center text-white shadow-sm">
          <p className="text-3xl font-bold">{stats.totalLogs}</p>
          <p className="mt-1 text-xs opacity-80">Entries</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-accent2 to-primaryLight px-5 py-4 text-center text-white shadow-sm">
          <p className="text-3xl font-bold">{stats.avgPain}<span className="text-sm opacity-70">/10</span></p>
          <p className="mt-1 text-xs opacity-80">Avg pain</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-accent2 to-accent px-5 py-4 text-center text-white shadow-sm">
          <p className="text-3xl font-bold">{stats.avgFatigue}<span className="text-sm opacity-70">/10</span></p>
          <p className="mt-1 text-xs opacity-80">Avg fatigue</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-success to-[#b8c9a3] px-5 py-4 text-center text-white shadow-sm">
          <p className="text-3xl font-bold capitalize">{stats.mostCommonMood}</p>
          <p className="mt-1 text-xs opacity-80">Top mood</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-primaryLight to-accent px-5 py-4 text-center text-white shadow-sm">
          <p className="text-3xl font-bold">{stats.totalRemedies}</p>
          <p className="mt-1 text-xs opacity-80">Remedies</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-success to-[#a8c0a0] px-5 py-4 text-center text-white shadow-sm">
          <p className="text-3xl font-bold">{stats.streak} <span className="text-sm opacity-70">d</span></p>
          <p className="mt-1 text-xs opacity-80">Streak</p>
        </div>
      </div>

      {/* ===== TODAY + WEEKLY ===== */}
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        {/* Today */}
        <div className="rounded-3xl bg-bgSoft ring-1 ring-primary/15 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-inkStrong">Today</h3>
              <p className="mt-1 text-sm text-inkMuted">{todayLog ? todayLog.log_date : "No entry yet"}</p>
            </div>
            {todayLog && (
              <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">Logged</span>
            )}
          </div>
          {todayLog ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-primary">{todayLog.pain_level}</p>
                <p className="mt-1 text-xs text-inkMuted">Pain</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-accent2">{todayLog.fatigue_level}</p>
                <p className="mt-1 text-xs text-inkMuted">Fatigue</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
                <p className="text-xl font-bold text-success capitalize">{todayLog.mood || "—"}</p>
                <p className="mt-1 text-xs text-inkMuted">Mood</p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-ink mb-4">Track your symptoms to see today's summary.</p>
              <Button fullWidth href="/diary">Log today's symptoms</Button>
            </div>
          )}
        </div>

        {/* Weekly */}
        <div className="rounded-3xl bg-bgSoft ring-1 ring-success/15 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-inkStrong">This week</h3>
              <p className="mt-1 text-sm text-inkMuted">{weeklyLog ? `Week of ${weeklyLog.week_start}` : "No check-in yet"}</p>
            </div>
            {weeklyLog && (
              <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">Done</span>
            )}
          </div>
          {weeklyLog ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-primary">{weeklyLog.avg_pain}</p>
                <p className="mt-1 text-xs text-inkMuted">Avg pain</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-accent2">{weeklyLog.bloating}</p>
                <p className="mt-1 text-xs text-inkMuted">Bloating</p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-ink mb-4">Do a weekly check-in to see your summary.</p>
              <Button fullWidth href="/weekly">Weekly check-in</Button>
            </div>
          )}
        </div>
      </div>

      {/* ===== HISTORY TABLES ===== */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Symptom Entries */}
        <Card title="Recent symptom entries" description="Your last 10 diary logs.">
          {recentLogs.length === 0 ? (
            <div className="mt-2">
              <p className="text-sm text-inkMuted mb-3">No entries yet.</p>
              <Button href="/diary" variant="secondary">Log symptoms</Button>
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs text-inkMuted">
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 pr-3">Pain</th>
                    <th className="pb-2 pr-3">Fatigue</th>
                    <th className="pb-2 pr-3">Mood</th>
                    <th className="pb-2 pr-3">Bleeding</th>
                    <th className="pb-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-ink/5 text-ink">
                      <td className="py-2 pr-3 text-xs">{log.log_date}</td>
                      <td className="py-2 pr-3 text-xs font-medium">{log.pain_level}/10</td>
                      <td className="py-2 pr-3 text-xs">{log.fatigue_level}/10</td>
                      <td className="py-2 pr-3 text-xs capitalize">{log.mood || "—"}</td>
                      <td className="py-2 pr-3 text-xs capitalize">{log.bleeding_intensity || "—"}</td>
                      <td className="py-2 text-xs max-w-[150px] truncate">{log.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Remedies */}
        <Card title="Recent remedies" description="Your last 5 remedy entries.">
          {recentRemedies.length === 0 ? (
            <div className="mt-2">
              <p className="text-sm text-inkMuted mb-3">No remedies logged yet.</p>
              <Button href="/remedies" variant="secondary">Log a remedy</Button>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              {recentRemedies.map((r) => (
                <div key={r.id} className="rounded-2xl bg-bgMuted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-inkStrong">{r.remedy_name}</span>
                    <span className="text-xs text-inkMuted">{r.effectiveness}/10</span>
                  </div>
                  <div className="mt-1 flex gap-2 text-xs text-inkMuted">
                    <span className="rounded-full bg-bgMuted px-2 py-0.5 capitalize">{r.remedy_category}</span>
                    <span>{r.log_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Button fullWidth href="/diary">Log symptoms</Button>
        <Button fullWidth variant="secondary" href="/weekly">Weekly check-in</Button>
        <Button fullWidth variant="secondary" href="/remedies">Log a remedy</Button>
      </div>
    </PageShell>
  );
}
