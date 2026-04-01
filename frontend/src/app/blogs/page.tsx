import { PageShell } from "@/components/layout/PageShell";

import { BlogTeaser } from "@/components/blog/BlogTeaser";
import { Card } from "@/components/ui/Card";

export default function BlogsPage() {
  return (
    <PageShell
      title="Blogs"
      subtitle="Education, research explainers, and privacy-first tracking tips."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Featured"
            description="Understanding patterns without compromising privacy"
            className="bg-bgSoft"
          >
            <div className="mt-4 grid gap-2 text-sm leading-7 text-ink">
              <p>
                EndowherAI is designed for pseudonymity. Learn what we mean by
                de-identification, what we don’t collect, and how you can keep
                notes safe.
              </p>
              <p className="text-sm font-medium text-inkStrong">
                Full posts coming soon.
              </p>
            </div>
          </Card>
        </div>
        <Card title="Browse" description="Start here">
          <div className="grid gap-2 text-sm text-ink">
            <p>Endometriosis basics</p>
            <p>Cycle phases & symptoms</p>
            <p>Remedies and evidence</p>
            <p>Privacy & consent</p>
          </div>
        </Card>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BlogTeaser
          title="How to track pain without tracking your identity"
          excerpt="Practical tips for pseudonymous logging, minimizing identifying notes, and staying in control of your data."
          date="2026-03-31"
          tag="Privacy"
          href="#"
        />
        <BlogTeaser
          title="Endometriosis symptom clusters across the cycle"
          excerpt="A plain-language overview of how symptoms may relate to cycle phases—and how to visualize patterns over time."
          date="2026-03-31"
          tag="Education"
          href="#"
        />
        <BlogTeaser
          title="Remedy tracking: correlation vs causation"
          excerpt="What ‘effectiveness’ signals can (and can’t) tell you, and how to interpret trends responsibly."
          date="2026-03-31"
          tag="Research"
          href="#"
        />
      </div>
    </PageShell>
  );
}
