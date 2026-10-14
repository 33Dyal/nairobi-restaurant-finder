import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

// items: [{ name, href }]. The last item is the current page and is not a link.
// Also outputs the matching BreadcrumbList structured data.
export default function Breadcrumbs({ items, className = "" }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-soft">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
                {item.href && !last ? (
                  <Link href={item.href} className="hover:text-ink hover:underline">{item.name}</Link>
                ) : (
                  <span aria-current="page" className="text-ink">{item.name}</span>
                )}
                {!last && <ChevronRight className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
