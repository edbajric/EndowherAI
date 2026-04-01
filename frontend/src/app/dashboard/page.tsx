"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalLogs: 0,
    avgPain: 0,
    avgFatigue: 0,
    mostCommonMood: "—",
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
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

      // Fetch all logs for this user
      const { data: logs } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("pseudonym_id", profile.pseudonym_id)
        .order("log_date", { ascending: false });

      if (logs && logs.length > 0) {
        const totalLogs = logs.length;
        const avgPain =
          Math.round(
            (logs.reduce((sum, l) => sum + l.pain_level, 0) / totalLogs) * 10
          ) / 10;
        const avgFatigue =
          Math.round(
            (logs.reduce((sum, l) => sum + (l.fatigue_level || 0), 0) /
              totalLogs) *
              10
          ) / 10;

        // Find most common mood
        const moodCounts: Record<string, number> = {};
        logs.forEach((l) => {
          if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
        });
        const mostCommonMood =
          Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "—";

        setStats({ totalLogs, avgPain, avgFatigue, mostCommonMood });
        setRecentLogs(logs.slice(0, 10));
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-900">Dashboard</h1>
          <nav className="flex gap-4 items-center">
            <a href="/diary" className="text-sm text-blue-600 hover:underline">
              Diary
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-5 shadow-md text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.totalLogs}</p>
            <p className="mt-1 text-sm text-zinc-500">Total Logs</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-md text-center">
            <p className="text-3xl font-bold text-red-500">{stats.avgPain}</p>
            <p className="mt-1 text-sm text-zinc-500">Avg Pain Level</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-md text-center">
            <p className="text-3xl font-bold text-amber-500">{stats.avgFatigue}</p>
            <p className="mt-1 text-sm text-zinc-500">Avg Fatigue</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-md text-center">
            <p className="text-3xl font-bold text-green-600 capitalize">
              {stats.mostCommonMood}
            </p>
            <p className="mt-1 text-sm text-zinc-500">Most Common Mood</p>
          </div>
        </div>

        {/* Recent Logs Table */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Recent Entries
          </h2>

          {recentLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No entries yet.{" "}
              <a href="/diary" className="text-blue-600 hover:underline">
                Log your first symptoms
              </a>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Pain</th>
                    <th className="pb-2 pr-4">Bleeding</th>
                    <th className="pb-2 pr-4">Mood</th>
                    <th className="pb-2 pr-4">Fatigue</th>
                    <th className="pb-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-zinc-100 text-zinc-700"
                    >
                      <td className="py-2 pr-4">{log.log_date}</td>
                      <td className="py-2 pr-4">{log.pain_level}/10</td>
                      <td className="py-2 pr-4 capitalize">
                        {log.bleeding_intensity}
                      </td>
                      <td className="py-2 pr-4 capitalize">{log.mood}</td>
                      <td className="py-2 pr-4">{log.fatigue_level}/10</td>
                      <td className="py-2 max-w-[200px] truncate">
                        {log.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
