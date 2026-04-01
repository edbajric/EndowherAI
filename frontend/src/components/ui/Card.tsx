import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function Card({ title, description, children, className }: CardProps) {
  return (
    <section
      className={[
        "rounded-3xl bg-bg/80 ring-1 ring-ink/10 shadow-sm",
        "px-6 py-5",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(title || description) && (
        <header className="mb-4">
          {title && (
            <h3 className="text-base font-semibold tracking-tight text-inkStrong">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm leading-6 text-inkMuted">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
