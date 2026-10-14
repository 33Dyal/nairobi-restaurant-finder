import Link from "next/link";
import Section from "@/components/ui/Section";

// Browse-by tiles. Only categories that actually have restaurants are shown.
export default function CategoryChips({ id, title, subtitle, param, items }) {
  const visible = items.filter((i) => i.count > 0);
  if (!visible.length) return null;
  return (
    <Section id={id} title={title} subtitle={subtitle} href="/explore" hrefLabel="Explore all">
      <ul className="flex flex-wrap gap-2.5">
        {visible.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/explore?${param}=${item.slug}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium transition-colors hover:border-jacaranda-500 hover:bg-jacaranda-50"
            >
              {item.name}
              <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-ink-soft" aria-label={`${item.count} restaurants`}>{item.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
