import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type BaseProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

type ButtonProps = BaseProps &
  (
    | ({ href: string } & Omit<ComponentProps<typeof Link>, "href">)
    | ({ href?: never } & ComponentProps<"button">)
  );

function getVariantClasses(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return "bg-primary text-white hover:bg-primary/90";
    case "secondary":
      return "bg-bg text-inkStrong ring-1 ring-ink/15 hover:bg-bgSoft";
    case "ghost":
      return "bg-transparent text-inkStrong hover:bg-bgSoft";
  }
}

export function Button(props: ButtonProps) {
  const { variant = "primary", fullWidth = false } = props;
  const className = [
    "inline-flex items-center justify-center gap-2",
    "h-11 px-5",
    "rounded-full",
    "text-sm font-medium",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    getVariantClasses(variant),
    fullWidth ? "w-full" : "w-auto",
    "className" in props ? props.className : "",
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && typeof props.href === "string") {
    const { href, fullWidth: fw, variant: v, ...rest } = props as Extract<
      ButtonProps,
      { href: string }
    >;
    void fw;
    void v;
    return <Link href={href} {...rest} className={className} />;
  }

  const { fullWidth: fw, variant: v, type, ...rest } = props as Extract<
    ButtonProps,
    { href?: never }
  > & { type?: "button" | "submit" | "reset" };
  void fw;
  void v;
  return <button type={type ?? "button"} {...rest} className={className} />;
}
