"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConsentToggle } from "@/components/ui/ConsentToggle";
import { DisclaimerBlock } from "@/components/ui/DisclaimerBlock";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"personal" | "research">("personal");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Supabase sends a confirmation email by default
    router.push("/login?message=Check your email to confirm your account");
  }

  return (
    <PageShell
      title="Create an anonymous account"
      subtitle="We generate a random user ID for you. No real name required."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Sign up" description="Start tracking in minutes.">
          <form onSubmit={handleSignup} className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-inkStrong">Email</span>
              <input
                className="h-11 rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-inkStrong">Password</span>
              <input
                className="h-11 rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </label>

            <div className="mt-2">
              <p className="mb-2 text-sm font-medium text-inkStrong">Consent</p>
              <ConsentToggle value={mode} onChange={setMode} />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button fullWidth disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-sm text-inkMuted">
              Already have an account?{" "}
              <Link className="font-medium text-inkStrong hover:underline" href="/login">
                Log in
              </Link>
              .
            </p>
          </form>
        </Card>

        <div className="grid gap-4">
          <Card title="What we store" description="Privacy-first defaults.">
            <div className="grid gap-3 text-sm leading-7 text-ink">
              <p>
                We only ask for what's needed to provide tracking, insights, and
                optional anonymized research aggregation.
              </p>
              <p>
                Sensitive fields (sexual activity, mental health, bowel/urinary
                symptoms) are always optional.
              </p>
              <p>
                You can regenerate your random user ID and delete your account and
                data.
              </p>
            </div>
          </Card>
          <DisclaimerBlock />
        </div>
      </div>
    </PageShell>
  );
}
