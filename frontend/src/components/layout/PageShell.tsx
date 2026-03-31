import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-inkStrong sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-base leading-7 text-inkMuted">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
