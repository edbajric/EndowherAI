"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const publicLinks = [
  { href: "/", label: "About" },
  { href: "/education", label: "Features" },
  { href: "/blogs", label: "Blog" },
  { href: "/privacy", label: "Privacy" },
];

const authedLinks = [
  { href: "/home", label: "Home" },
  { href: "/diary", label: "Diary" },
  { href: "/weekly", label: "Weekly" },
  { href: "/insights", label: "Insights" },
  { href: "/remedies", label: "Remedies" },
  { href: "/education", label: "Education" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const links = user ? authedLinks : publicLinks;

  function isActive(href: string) {
    if (href === "/" || href === "/home") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70 border-b border-ink/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href={user ? "/home" : "/"} className="flex items-center gap-3 shrink-0">
          <Image
            src="/Logos/EndowherAI_logo_small.png"
            alt="EndowherAI"
            width={40}
            height={40}
            priority
            className="h-10 w-10"
          />
          <span className="text-lg font-semibold tracking-tight text-inkStrong hidden sm:block">
            EndowherAI
          </span>
        </Link>

        {/* Center nav — desktop */}
        <nav className="hidden items-center gap-1 lg:flex absolute left-1/2 -translate-x-1/2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-accent/25 text-inkStrong"
                  : "text-ink hover:text-inkStrong hover:bg-ink/5",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg ring-1 ring-ink/10 hover:bg-bgMuted lg:hidden"
          >
            {open ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Desktop auth buttons */}
          {!loading && (
            <div className="hidden items-center gap-2 lg:flex">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-5 py-2 text-sm font-medium text-ink transition-colors hover:text-inkStrong hover:bg-ink/5"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-inkStrong/20"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-[64px] z-50 mx-auto w-full max-w-lg px-4 sm:px-6">
            <div className="rounded-3xl bg-bg ring-1 ring-ink/10 shadow-lg p-4">
              <div className="grid gap-1 text-sm font-medium text-ink">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "rounded-2xl px-4 py-3 transition-colors",
                      isActive(link.href)
                        ? "bg-accent/20 text-inkStrong"
                        : "hover:bg-bgMuted",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="my-3 h-px bg-ink/10" />

              {user ? (
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-ink hover:bg-bgMuted"
                >
                  Log out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-bg ring-1 ring-ink/10 px-4 py-2.5 text-center text-sm font-medium text-inkStrong hover:bg-bgMuted"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
