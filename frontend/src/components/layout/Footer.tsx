import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto bg-inkStrong text-bg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-tight">EndowherAI</p>
          <p className="mt-2 text-sm leading-6 text-bg/80">
            Anonymous endometriosis and menstrual health tracking.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-tight">Links</p>
          <div className="mt-3 grid gap-2 text-sm text-bg/80">
            <Link className="hover:text-bg" href="/privacy">
              Privacy & consent
            </Link>
            <Link className="hover:text-bg" href="/terms">
              Terms
            </Link>
            <Link className="hover:text-bg" href="/imprint">
              Imprint
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-tight">Contact</p>
          <div className="mt-3 grid gap-2 text-sm text-bg/80">
            <Link className="hover:text-bg" href="/contact">
              Feedback & bug reports
            </Link>
            <Link className="hover:text-bg" href="/consent-withdrawal">
              Consent withdrawal
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-bg/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-bg/70 sm:px-6">
          <p>© {new Date().getFullYear()} EndowherAI</p>
          <p>Built privacy-first for sensitive health tracking.</p>
        </div>
      </div>
    </footer>
  );
}
