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
    <header className="sticky top-0 z-50 w-full bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70 border-b border-ink/5">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-0 sm:px-6 lg:px-8">
        
        {/* LEFT SECTION: Logo */}
        <div className="flex flex-1 items-center justify-start">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/Logos/EndowherAI_logo_medium.svg"
              alt="EndowherAI"
              width={96}
              height={70}
              priority
            />
          </Link>
        </div>

        {/* MIDDLE SECTION: Navigation (Centered) */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink lg:flex">
          <Link className="transition-colors hover:text-inkStrong" href="/home">
            Home
          </Link>
          <Link className="transition-colors hover:text-inkStrong" href="/diary">
            Diary
          </Link>
          <Link className="transition-colors hover:text-inkStrong" href="/weekly">
            Weekly
          </Link>
          <Link className="transition-colors hover:text-inkStrong" href="/insights">
            Insights
          </Link>
          <Link className="transition-colors hover:text-inkStrong" href="/remedies">
            Remedies
          </Link>
          <Link className="transition-colors hover:text-inkStrong" href="/research/stats">
            Research
          </Link>
          <Link className="transition-colors hover:text-inkStrong" href="/education">
            Education
          </Link>
          <Link className="transition-colors hover:text-inkStrong" href="/blogs">
            Blogs
          </Link>
        </nav>

        {/* RIGHT SECTION: Actions */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg ring-1 ring-ink/10 hover:bg-bgMuted lg:hidden"
          >
            {open ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
                <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Buttons */}
          <Button
            variant="ghost"
            href="/login"
            className="hidden whitespace-nowrap sm:inline-flex h-9 px-4 text-sm font-medium"
          >
            Log in
          </Button>
          <Button
            href="/signup"
            className="whitespace-nowrap h-9 px-4 text-sm font-medium"
          >
            Get started
          </Button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-inkStrong/20 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-[70px] z-50 mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 shadow-xl p-3">
              <div className="grid gap-1 text-sm font-medium text-ink">
                {[
                  { name: "Home", href: "/home" },
                  { name: "Symptom diary", href: "/diary" },
                  { name: "Weekly check-in", href: "/weekly" },
                  { name: "Insights", href: "/insights" },
                  { name: "Remedies", href: "/remedies" },
                  { name: "Research statistics", href: "/research/stats" },
                ].map((item) => (
                  <Link 
                    key={item.href}
                    className="rounded-2xl px-4 py-3 hover:bg-bgMuted" 
                    href={item.href} 
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                <div className="my-2 h-px bg-ink/10" />

                {[
                  { name: "Education", href: "/education" },
                  { name: "Privacy & consent", href: "/privacy" },
                  { name: "Blogs", href: "/blogs" },
                  { name: "Contact", href: "/contact" },
                ].map((item) => (
                  <Link 
                    key={item.href}
                    className="rounded-2xl px-4 py-3 hover:bg-bgMuted" 
                    href={item.href} 
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
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