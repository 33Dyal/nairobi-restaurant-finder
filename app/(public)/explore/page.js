import Link from "next/link";
import Section from "@/components/ui/Section";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import SearchInput from "@/components/search/HeroSearch";
import Filters from "@/components/search/Filters";
import Pagination from "@/components/search/Pagination";
import { getSession } from "@/lib/auth/current-user";
import { getFacets, searchRestaurants, recordSearch } from "@/lib/search";
import { searchParamsSchema } from "@/lib/validation/search";

import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({ title: "Explore restaurants", description: "Browse restaurants in Nairobi by cuisine, area, price range, vibe and rating.", path: "/explore" });
export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }) {
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const params = searchParamsSchema.parse(flat);
  const query = Object.fromEntries(Object.entries(flat).filter(([k]) => k !== "page"));

  const [facets, { items, total, pages }] = await Promise.all([getFacets(), searchRestaurants(params)]);
  if (params.q && params.page === 1) {
    const session = await getSession();
    await recordSearch(params, total, session?.userId ?? null);
  }

  return (
    <Section
      id="explore"
      level={1}
      title="Explore restaurants"
      subtitle="Search and combine filters to find your next meal"
      breadcrumbs={<Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Explore" }]} />}
    >
      {/* FIX: HeroSearch expects cuisines, areas and vibes props */}
      <SearchInput key={params.q} cuisines={facets.cuisines} areas={facets.areas} vibes={facets.vibes} />
      <div className="mt-5"><Filters facets={facets} /></div>

      <p className="mt-6 text-sm text-ink-soft" aria-live="polite">
        {total} {total === 1 ? "restaurant" : "restaurants"}{params.q ? ` for \u201C${params.q}\u201D` : ""}
      </p>

      {items.length ? (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((r) => <li key={r.id}><RestaurantCard restaurant={r} headingLevel={2} /></li>)}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold">No restaurants match your search</p>
          <Link href="/explore" className="mt-3 inline-block text-sm font-semibold text-jacaranda-700 hover:underline">Clear all filters</Link>
        </div>
      )}
      {/* Pagination reads totalPages and searchParams. The old props (pages, query) were ignored,
          so the page controls never appeared. */}
      <Pagination page={params.page} totalPages={pages} searchParams={query} basePath="/explore" />
    </Section>
  );
}
