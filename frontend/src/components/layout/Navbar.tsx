"use client";

import Image from "next/image";
import Link from "next/link";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-1.5 py-0 sm:px-2">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/Logos/EndowherAI_logo_medium.svg"
              alt="EndowherAI"
              width={96}
              height={30}
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-ink lg:flex">
            <Link className="hover:text-inkStrong" href="/home">
              Home
            </Link>
            <Link className="hover:text-inkStrong" href="/diary">
              Diary
            </Link>
            <Link className="hover:text-inkStrong" href="/weekly">
              Weekly
            </Link>
            <Link className="hover:text-inkStrong" href="/insights">
              Insights
            </Link>
            <Link className="hover:text-inkStrong" href="/remedies">
              Remedies
            </Link>
            <Link className="hover:text-inkStrong" href="/research/stats">
              Research
            </Link>
            <Link className="hover:text-inkStrong" href="/education">
              Education
            </Link>
            <Link className="hover:text-inkStrong" href="/blogs">
              Blogs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg ring-1 ring-ink/10 hover:bg-bgMuted lg:hidden"
          >
            {open ? (
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          <Button
            variant="ghost"
            href="/login"
            className="hidden whitespace-nowrap sm:inline-flex h-7 px-4 text-sm font-medium"
          >
            Log in
          </Button>
          <Button
            href="/signup"
            className="whitespace-nowrap h-5 px-3 text-sm font-medium"
          >
            Get started
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-inkStrong/20"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-[60px] z-50 mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 shadow-sm p-3">
              <div className="grid gap-1 text-sm font-medium text-ink">
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/home" onClick={() => setOpen(false)}>
                  Home
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/diary" onClick={() => setOpen(false)}>
                  Symptom diary
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/weekly" onClick={() => setOpen(false)}>
                  Weekly check-in
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/insights" onClick={() => setOpen(false)}>
                  Insights
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/remedies" onClick={() => setOpen(false)}>
                  Remedies
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/research/stats" onClick={() => setOpen(false)}>
                  Research statistics
                </Link>

                <div className="my-2 h-px bg-ink/10" />

                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/education" onClick={() => setOpen(false)}>
                  Education
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/privacy" onClick={() => setOpen(false)}>
                  Privacy & consent
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/blogs" onClick={() => setOpen(false)}>
                  Blogs
                </Link>
                <Link className="rounded-2xl px-4 py-3 hover:bg-bgMuted" href="/contact" onClick={() => setOpen(false)}>
                  Contact
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  href="/login"
                  fullWidth
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Button>
                <Button href="/signup" fullWidth onClick={() => setOpen(false)}>
                  Get started
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
