/**
 * Active-remedies regimen hook — backed by Supabase `active_remedies` table.
 *
 * Each row represents a remedy the user is currently taking / doing regularly.
 * Rows persist until the user explicitly removes them.
 *
 * Used by:
 *  - /remedies  → add / remove from the regimen
 *  - /diary     → quick-log (amount only) for every active remedy
 *  - /home      → show current regimen card
 */

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

// ─── Type mirrors the DB table (snake_case) ───────────────────────────────────

export interface ActiveRemedy {
  id:              string;
  pseudonym_id:    string;
  remedy_name:     string;
  remedy_category: string;   // tea | supplement | exercise | heat | diet | meditation | medication | other
  emoji:           string;
  unit:            string;   // "ml" | "min" | "tablet(s)" | "serving(s)" | ""
  started_at:      string;   // ISO timestamp
}

// ─── Derive quick-pick amounts from category (not stored in DB) ──────────────

export function getQuickAmounts(category: string): number[] {
  switch (category) {
    case "tea":        return [150, 200, 250, 300, 500];
    case "supplement": return [1, 2, 3, 4];
    case "exercise":   return [15, 30, 45, 60, 90];
    case "heat":       return [10, 20, 30, 45, 60];
    case "diet":       return [1, 2, 3];
    case "meditation": return [5, 10, 15, 20, 30];
    case "medication": return [1, 2];
    default:           return [];
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useActiveRemedies(pseudonymId: string | null) {
  const supabase = createClient();
  const [remedies, setRemedies] = useState<ActiveRemedy[]>([]);
  const [loading,  setLoading]  = useState(false);

  const fetchRemedies = useCallback(async () => {
    if (!pseudonymId) return;
    setLoading(true);
    const { data } = await supabase
      .from("active_remedies")
      .select("*")
      .eq("pseudonym_id", pseudonymId)
      .order("started_at", { ascending: true });
    if (data) setRemedies(data as ActiveRemedy[]);
    setLoading(false);
  }, [pseudonymId]);

  useEffect(() => {
    fetchRemedies();
  }, [fetchRemedies]);

  const add = useCallback(
    async (entry: Pick<ActiveRemedy, "remedy_name" | "remedy_category" | "emoji" | "unit">) => {
      if (!pseudonymId) return;
      // Prevent exact duplicates
      if (
        remedies.some(
          (r) => r.remedy_name === entry.remedy_name && r.remedy_category === entry.remedy_category,
        )
      ) return;

      const { data, error } = await supabase
        .from("active_remedies")
        .insert({ pseudonym_id: pseudonymId, ...entry })
        .select()
        .single();

      if (!error && data) {
        setRemedies((prev) => [...prev, data as ActiveRemedy]);
      }
    },
    [pseudonymId, remedies],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("active_remedies")
        .delete()
        .eq("id", id);

      if (!error) {
        setRemedies((prev) => prev.filter((r) => r.id !== id));
      }
    },
    [],
  );

  const isActive = useCallback(
    (remedyName: string, category: string) =>
      remedies.some(
        (r) => r.remedy_name === remedyName && r.remedy_category === category,
      ),
    [remedies],
  );

  return { remedies, loading, add, remove, isActive };
}
