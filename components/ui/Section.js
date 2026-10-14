import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// `level={1}` makes the title the page's <h1>. Use it once per page, on the main section.
// `breadcrumbs` is an optional element shown above the title.
export default function Section({ id, title, subtitle, href, hrefLabel = "See all", level = 2, breadcrumbs, children, className }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section aria-labelledby={`${id}-title`} className={cn("w-full px-4 py-8 sm:px-6 lg:px-8", className)}>
      {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Heading id={`${id}-title`} className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</Heading>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-lantern hover:text-white">
            {hrefLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
