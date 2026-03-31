"use client";

import { useId } from "react";

type LikertOption = {
  label: string;
  value: number;
};

type LikertProps = {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  description?: string;
  optional?: boolean;
  options?: LikertOption[];
};

const defaultOptions: LikertOption[] = [
  { label: "Not at all", value: 0 },
  { label: "A little", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "A lot", value: 3 },
  { label: "Severe", value: 4 },
];

export function Likert({
  label,
  value,
  onChange,
  description,
  optional = false,
  options = defaultOptions,
}: LikertProps) {
  const id = useId();

  return (
    <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <p id={id} className="text-sm font-medium text-inkStrong">
          {label}
        </p>
        {optional && (
          <span className="shrink-0 rounded-full bg-bgMuted px-3 py-1 text-xs font-medium text-inkStrong">
            Optional
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs leading-5 text-inkMuted">{description}</p>
      )}

      <div
        className="mt-4 grid gap-2 sm:grid-cols-5"
        role="radiogroup"
        aria-labelledby={id}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "h-11 rounded-full px-3 text-xs font-medium transition-colors",
              value === o.value
                ? "bg-accent text-inkStrong"
                : "bg-bgMuted/60 text-inkStrong hover:bg-bgMuted",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-inkMuted">Selected: {value ?? "—"}</p>
    </div>
  );
}
