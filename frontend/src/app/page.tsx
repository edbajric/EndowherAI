import Image from "next/image";

import { Card } from "@/components/ui/Card";
import { DisclaimerBlock } from "@/components/ui/DisclaimerBlock";
import { PrivacyStatement } from "@/components/ui/PrivacyStatement";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="bg-bgSoft">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-inkMuted">
              Anonymous tracking • Privacy-first • Optional research contribution
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-inkStrong sm:text-5xl">
              Welcome to EndowherAI — Endometriosis and cycle tracking, without
              identity.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink">
              Track symptoms, cycles, and remedies. Visualize your patterns. If you
              choose, contribute de-identified data to help research discover
              trends.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/signup" className="justify-center">
                Track symptoms
              </Button>
              <Button variant="secondary" href="/research/signup" className="justify-center">
                Join research
              </Button>
            </div>

            <div className="mt-8 grid gap-3">
              <PrivacyStatement />
              <DisclaimerBlock />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-48 w-48 rounded-full bg-accent/25 blur-2xl" />
            <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-success/25 blur-2xl" />

            <div className="relative mx-auto w-full max-w-md">
              <Card className="bg-bg/70">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-bgMuted/50 p-4">
                    <p className="text-xs font-medium text-inkMuted">Today</p>
                    <p className="mt-2 text-2xl font-semibold text-inkStrong">6/10</p>
                    <p className="mt-1 text-xs text-inkMuted">Pelvic pain</p>
                  </div>
                  <div className="rounded-3xl bg-bgMuted/50 p-4">
                    <p className="text-xs font-medium text-inkMuted">Cycle</p>
                    <p className="mt-2 text-2xl font-semibold text-inkStrong">Luteal</p>
                    <p className="mt-1 text-xs text-inkMuted">Estimated phase</p>
                  </div>
                </div>
                <div className="mt-4 rounded-3xl bg-bgMuted/50 p-3">
                  <Image
                    src="/Images/stats_mockup.png"
                    alt="Insights preview"
                    width={900}
                    height={700}
                    className="h-auto w-full rounded-2xl"
                    priority
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-inkStrong sm:text-3xl">
          What you can do with EndowherAI
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Log daily symptoms" description="Simple sliders, optional notes.">
            <Image
              src="/Images/daily_log_mockup.png"
              alt="Daily log mockup"
              width={600}
              height={700}
              className="mt-2 h-auto w-full rounded-2xl"
            />
          </Card>

          <Card title="Track your cycle" description="Calendar + cycle view in one place.">
            <Image
              src="/Images/calendar_mockup.png"
              alt="Calendar mockup"
              width={600}
              height={700}
              className="mt-2 h-auto w-full rounded-2xl"
            />
          </Card>

          <Card title="Understand patterns" description="Pain vs cycle, triggers, trends.">
            <Image
              src="/Images/stats_mockup.png"
              alt="Statistics mockup"
              width={600}
              height={700}
              className="mt-2 h-auto w-full rounded-2xl"
            />
          </Card>

          <Card title="Share with a doctor" description="Export a clear report (PDF/CSV).">
            <Image
              src="/Images/video_mockup.png"
              alt="Report mockup"
              width={600}
              height={700}
              className="mt-2 h-auto w-full rounded-2xl"
            />
          </Card>
        </div>
      </section>

      <section className="bg-bg px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-inkStrong sm:text-3xl">
              Why we exist
            </h2>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-ink">
              <p>
                Endometriosis and menstrual health tracking is deeply personal.
                Many people avoid tools that require identifiable accounts.
              </p>
              <p>
                EndowherAI is built for pseudonymity: no real name required, and
                consent is explicit for any research-style contribution.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Pseudonymous by default" description="Random user ID. No real name.">
              <Image
                src="/Images/girl_holding_herbelly.svg"
                alt="Pseudonymous"
                width={240}
                height={220}
                className="mt-3 h-40 w-auto"
              />
            </Card>
            <Card title="Consent-first research" description="Opt-in only, toggle anytime.">
              <Image
                src="/Images/analyze_data.svg"
                alt="Research"
                width={240}
                height={220}
                className="mt-3 h-40 w-auto"
              />
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-inkStrong sm:text-3xl">
          How the process works
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="1. Track" description="Daily or weekly check-ins.">
            <Image
              src="/Images/track_data.svg"
              alt="Track data"
              width={220}
              height={180}
              className="mt-3 h-28 w-auto"
            />
          </Card>
          <Card title="2. Fill" description="Optional sensitive fields.">
            <Image
              src="/Images/fill_out_data.svg"
              alt="Fill out data"
              width={220}
              height={180}
              className="mt-3 h-28 w-auto"
            />
          </Card>
          <Card title="3. Analyze" description="Trends, correlations, endo score.">
            <Image
              src="/Images/read_stats.svg"
              alt="Read statistics"
              width={220}
              height={180}
              className="mt-3 h-28 w-auto"
            />
          </Card>
          <Card title="4. Share" description="Doctor report export.">
            <Image
              src="/Images/arrow.svg"
              alt="Share"
              width={220}
              height={180}
              className="mt-8 h-10 w-auto"
            />
          </Card>
        </div>
      </section>

      <section className="bg-bg px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-inkStrong sm:text-3xl">
              Ready to start — anonymously?
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink">
              Create a pseudonymous account in seconds. You can later delete your
              account and remove all data.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/signup" className="justify-center">
                Create anonymous account
              </Button>
              <Button variant="secondary" href="/privacy" className="justify-center">
                Read privacy & consent
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <a href="#" className="inline-flex">
                <Image
                  src="/Images/appstore.png"
                  alt="App Store"
                  width={140}
                  height={46}
                  className="h-auto"
                  style={{ width: "auto", height: "auto" }}
                />
              </a>
              <a href="#" className="inline-flex">
                <Image
                  src="/Images/googleplay.webp"
                  alt="Google Play"
                  width={156}
                  height={46}
                  className="h-auto"
                  style={{ width: "auto", height: "auto" }}
                />
              </a>
            </div>
          </div>

          <Card className="bg-bgSoft">
            <Image
              src="/Images/two_women.svg"
              alt="Community"
              width={520}
              height={420}
              className="h-auto w-full"
              priority
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
