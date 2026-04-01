import Image from "next/image";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export default function AdPage() {
  return (
    <PageShell
      title="Why EndowherAI"
      subtitle="Benefits, testimonials, and anonymity explanation. (Frontend-only placeholder)"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Screenshots" description="A quick look at the app">
          <Image
            src="/Images/chat_mockup.png"
            alt="App screenshot"
            width={800}
            height={800}
            className="mt-2 h-auto w-full rounded-2xl"
          />
        </Card>
        <Card title="Anonymity" description="How we protect privacy">
          <div className="grid gap-3 text-sm leading-7 text-ink">
            <p>Pseudonymous account with a random user ID.</p>
            <p>Research participation is opt-in.</p>
            <p>Sensitive answers are optional.</p>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
