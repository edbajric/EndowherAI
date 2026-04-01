"use client";

import { useId } from "react";

type ConsentMode = "personal" | "research";

type ConsentToggleProps = {
  value: ConsentMode;
  onChange: (value: ConsentMode) => void;
};

export function ConsentToggle({ value, onChange }: ConsentToggleProps) {
  const id = useId();

  return (
    <div className="rounded-3xl bg-bg ring-1 ring-ink/10 p-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={value === "personal"}
          onClick={() => onChange("personal")}
          className={[
            "h-11 rounded-full px-4 text-sm font-medium transition-colors",
            value === "personal"
              ? "bg-success text-inkStrong"
              : "bg-transparent text-inkStrong hover:bg-bgMuted",
          ].join(" ")}
        >
          Personal tracking only
        </button>
        <button
          type="button"
          aria-pressed={value === "research"}
          onClick={() => onChange("research")}
          className={[
            "h-11 rounded-full px-4 text-sm font-medium transition-colors",
            value === "research"
              ? "bg-accent text-inkStrong"
              : "bg-transparent text-inkStrong hover:bg-bgMuted",
          ].join(" ")}
        >
          Contribute anonymized research
        </button>
      </div>
      <p id={id} className="px-4 pt-3 text-xs leading-5 text-inkMuted">
        You can change this anytime in your profile. Sensitive fields are optional.
      </p>
    </div>
  );
}
