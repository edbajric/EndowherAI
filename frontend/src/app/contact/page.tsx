import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  return (
    <PageShell
      title="Contact & feedback"
      subtitle="Bug reports, questions, and consent withdrawal. (Frontend-only placeholder)"
    >
      <Card title="Send feedback" description="Frontend-only form">
        <form className="mt-4 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-inkStrong">Topic</span>
            <input
              className="h-11 rounded-2xl bg-bg px-4 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
              placeholder="Bug report / Question / Consent"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-inkStrong">Message</span>
            <textarea
              className="min-h-32 rounded-2xl bg-bg px-4 py-3 ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
              placeholder="Write your message..."
            />
          </label>

          <Button>Send</Button>
        </form>
      </Card>
    </PageShell>
  );
}
