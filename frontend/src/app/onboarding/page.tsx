"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function OnboardingPage() {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleConsent() {
    if (!consent) {
      setError("You must accept the terms to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated. Please log in again.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        consent_flag: true,
        consent_timestamp: new Date().toISOString(),
      })
      .eq("auth_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/diary";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900">
          Welcome to EndoWherAI
        </h1>

        <div className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-zinc-700 leading-relaxed">
          <p className="mb-3">
            This app helps you track symptoms related to endometriosis and PCOS.
            Your health data is sensitive and we treat it that way.
          </p>
          <p className="mb-3">
            <strong>How we protect your data:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your identity is separated from your health logs using anonymous IDs</li>
            <li>Only you can see your own data (enforced at the database level)</li>
            <li>We do not share your data with third parties</li>
            <li>You can delete your data at any time</li>
          </ul>
          <p className="mt-3">
            By continuing, you consent to your symptom data being stored securely
            for the purpose of personal health tracking and optional AI-powered insights.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700">
            I understand and agree to the data handling practices described above.
          </span>
        </label>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleConsent}
          disabled={loading}
          className="mt-6 w-full rounded-md bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue to Diary"}
        </button>
      </div>
    </div>
  );
}
