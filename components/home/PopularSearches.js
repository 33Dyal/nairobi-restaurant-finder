import Link from "next/link";
import { Search } from "lucide-react";
import Section from "@/components/ui/Section";
import { SEARCH_EXAMPLES } from "@/lib/constants/labels";

export default function PopularSearches({ searches }) {
  const items = searches.length
    ? searches.map((q) => ({ label: q, href: `/explore?q=${encodeURIComponent(q)}` }))
    : SEARCH_EXAMPLES;
  return (
    <Section id="popular-searches" title="Popular searches" subtitle="What people are looking for right now">
      <ul className="flex flex-wrap gap-2.5">
        {items.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-jacaranda-50 px-4 text-sm font-medium capitalize text-jacaranda-700 hover:bg-jacaranda-100">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />{s.label}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
