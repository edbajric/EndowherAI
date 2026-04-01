import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PrivacyStatement } from "@/components/ui/PrivacyStatement";

export default function LoginPage() {
  return (
    <PageShell
      title="Log in"
      subtitle="Use your pseudonymous credentials. No real name is required."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Welcome back" description="Log in to continue tracking.">
          <form className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-inkStrong">Email</span>
              <input
                className="h-11 rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-inkStrong">Password</span>
              <input
                className="h-11 rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            <Button fullWidth>Log in</Button>

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
    </PageShell>
  );
}
