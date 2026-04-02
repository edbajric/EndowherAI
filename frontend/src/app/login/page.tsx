"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PrivacyStatement } from "@/components/ui/PrivacyStatement";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <>
      {message && (
        <p className="mb-6 rounded-2xl bg-accent/10 px-5 py-3 text-sm text-inkStrong">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Welcome back" description="Log in to continue tracking.">
          <form onSubmit={handleLogin} className="mt-4 grid gap-4">
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
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button fullWidth disabled={loading} type="submit">
              {loading ? "Logging in..." : "Log in"}
            </Button>

            <p className="text-sm text-inkMuted">
              New here?{" "}
              <Link className="font-medium text-inkStrong hover:underline" href="/signup">
                Create an anonymous account
              </Link>
              .
            </p>
          </form>
        </Card>

        <div className="grid gap-4">
          <PrivacyStatement />
          <Card title="Account safety" description="Tips for staying anonymous.">
            <div className="grid gap-3 text-sm leading-7 text-ink">
              <p>Use an email address that does not reveal your identity.</p>
              <p>Do not include real names in notes or custom remedy titles.</p>
              <p>
                You can delete your account and remove all data from your profile
                settings.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <PageShell
      title="Log in"
      subtitle="Use your pseudonymous credentials. No real name is required."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}
