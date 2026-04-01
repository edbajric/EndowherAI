"use client";

import { useId } from "react";

type Slider010Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  optional?: boolean;
};

export function Slider010({
  label,
  value,
  onChange,
  description,
  optional = false,
}: Slider010Props) {
  const id = useId();

  return (
    <div className="rounded-3xl bg-bg ring-1 ring-ink/10 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={id} className="text-sm font-medium text-inkStrong">
            {label}
            {optional && <span className="ml-2 text-xs text-inkMuted">Optional</span>}
          </label>
          {description && (
            <p className="mt-1 text-xs leading-5 text-inkMuted">{description}</p>
          )}
        </div>
        <div className="shrink-0 rounded-full bg-bgMuted px-3 py-1 text-xs font-semibold text-inkStrong">
          {value}/10
        </div>
      </div>

      <div className="mt-4">
        <input
          id={id}
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[color:var(--accent-2)]"
        />
        <div className="mt-2 flex justify-between text-[11px] text-inkMuted">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}
