"use client";

import type { ReactNode } from "react";

type SensitiveSectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function SensitiveSection({
  title,
  hint = "These questions are optional.",
  children,
  defaultOpen = false,
}: SensitiveSectionProps) {
  return (
    <details
      className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-tight text-inkStrong">
              {title}
            </p>
            <p className="mt-1 text-xs leading-5 text-inkMuted">{hint}</p>
          </div>
          <span className="rounded-full bg-bgMuted px-3 py-1 text-xs font-medium text-inkStrong">
            Optional
          </span>
        </div>
      </summary>

      <div className="mt-4 grid gap-4">{children}</div>
    </details>
  );
}
