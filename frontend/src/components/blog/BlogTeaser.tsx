import Link from "next/link";

import { Card } from "@/components/ui/Card";

type BlogTeaserProps = {
  title: string;
  excerpt: string;
  date: string;
  href: string;
  tag?: string;
};

export function BlogTeaser({ title, excerpt, date, href, tag }: BlogTeaserProps) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:bg-bg">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-inkMuted">{date}</p>
          {tag && (
            <span className="rounded-full bg-bgMuted px-3 py-1 text-xs font-medium text-ink">
              {tag}
            </span>
          )}
        </div>
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-inkStrong">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink">{excerpt}</p>
        <p className="mt-4 text-sm font-medium text-inkStrong">Read more</p>
      </Card>
    </Link>
  );
}
