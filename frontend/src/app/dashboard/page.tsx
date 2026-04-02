"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalLogs: 0,
    avgPain: 0,
    avgFatigue: 0,
    mostCommonMood: "—",
    totalRemedies: 0,
    totalWeekly: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentRemedies, setRecentRemedies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("pseudonym_id")
        .eq("auth_id", user.id)
        .single();

      if (!profile) return;

      const pid = profile.pseudonym_id;

      // Fetch symptom logs
      const { data: logs } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("pseudonym_id", pid)
        .order("log_date", { ascending: false });

      if (logs && logs.length > 0) {
        const totalLogs = logs.length;
        const avgPain =
          Math.round(
            (logs.reduce((sum, l) => sum + (l.pain_level || 0), 0) / totalLogs) * 10
          ) / 10;
        const avgFatigue =
          Math.round(
            (logs.reduce((sum, l) => sum + (l.fatigue_level || 0), 0) / totalLogs) * 10
          ) / 10;

        const moodCounts: Record<string, number> = {};
        logs.forEach((l) => {
          if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
        });
        const mostCommonMood =
          Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

        setStats((s) => ({ ...s, totalLogs, avgPain, avgFatigue, mostCommonMood }));
        setRecentLogs(logs.slice(0, 10));
      }

      // Fetch remedy count
      const { data: remedies } = await supabase
        .from("remedy_logs")
        .select("*")
        .eq("pseudonym_id", pid)
        .order("log_date", { ascending: false });

      if (remedies) {
        setStats((s) => ({ ...s, totalRemedies: remedies.length }));
        setRecentRemedies(remedies.slice(0, 5));
      }

      // Fetch weekly count
      const { count } = await supabase
        .from("weekly_logs")
        .select("*", { count: "exact", head: true })
        .eq("pseudonym_id", pid);

      if (count != null) {
        setStats((s) => ({ ...s, totalWeekly: count }));
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <PageShell title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <p className="text-inkMuted">Loading dashboard...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="Your complete tracking overview."
    >
      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-3xl bg-bg/80 ring-1 ring-ink/10 px-5 py-4 text-center">
          <p className="text-2xl font-semibold text-inkStrong">{stats.totalLogs}</p>
          <p className="mt-1 text-xs text-inkMuted">Symptom entries</p>
        </div>
        <div className="rounded-3xl bg-bg/80 ring-1 ring-ink/10 px-5 py-4 text-center">
          <p className="text-2xl font-semibold text-inkStrong">{stats.avgPain}/10</p>
          <p className="mt-1 text-xs text-inkMuted">Avg pain</p>
        </div>
        <div className="rounded-3xl bg-bg/80 ring-1 ring-ink/10 px-5 py-4 text-center">
          <p className="text-2xl font-semibold text-inkStrong">{stats.avgFatigue}/10</p>
          <p className="mt-1 text-xs text-inkMuted">Avg fatigue</p>
        </div>
        <div className="rounded-3xl bg-bg/80 ring-1 ring-ink/10 px-5 py-4 text-center">
          <p className="text-2xl font-semibold text-inkStrong capitalize">{stats.mostCommonMood}</p>
          <p className="mt-1 text-xs text-inkMuted">Top mood</p>
        </div>
        <div className="rounded-3xl bg-bg/80 ring-1 ring-ink/10 px-5 py-4 text-center">
          <p className="text-2xl font-semibold text-inkStrong">{stats.totalRemedies}</p>
          <p className="mt-1 text-xs text-inkMuted">Remedies logged</p>
        </div>
        <div className="rounded-3xl bg-bg/80 ring-1 ring-ink/10 px-5 py-4 text-center">
          <p className="text-2xl font-semibold text-inkStrong">{stats.totalWeekly}</p>
          <p className="mt-1 text-xs text-inkMuted">Weekly check-ins</p>
        </div>
      </div>

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
                    <tr
                      key={log.id}
                      className="border-b border-ink/5 text-ink"
                    >
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
    </PageShell>
  );
}
