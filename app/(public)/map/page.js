import Link from "next/link";
import Section from "@/components/ui/Section";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import MapLoader from "@/components/map/MapLoader";
import { getMapRestaurants } from "@/lib/data/map";

import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({ title: "Restaurant map", description: "See restaurants across Nairobi on an interactive map.", path: "/map" });
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const restaurants = await getMapRestaurants();

  return (
    <Section
      id="map"
      level={1}
      title="Restaurant map"
      subtitle="Browse Nairobi restaurants by location"
      breadcrumbs={<Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Map" }]} />}
    >
      {restaurants.length === 0 ? (
        <EmptyState title="No restaurants to show yet">Check back soon.</EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-soft" aria-live="polite">
            {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"} on the map
          </p>

          {/* Every pin on the map is a keyboard stop, so keyboard users get a way past it. */}
          <a
            href="#map-list"
            className="sr-only focus:not-sr-only focus:mb-3 focus:inline-block focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
          >
            Skip the map and go to the list of restaurants
          </a>

          <MapLoader restaurants={restaurants} />

          {/* A plain list of the same restaurants: a text alternative to the map, and
              crawlable links to every restaurant page. */}
          <section id="map-list" aria-labelledby="map-list-title" tabIndex={-1} className="mt-8 focus:outline-none">
            <h2 id="map-list-title" className="font-display text-xl font-bold">All restaurants on the map</h2>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <li key={r.id} className="text-sm">
                  <Link href={`/restaurants/${r.slug}`} className="font-medium text-lantern hover:underline">{r.name}</Link>
                  {r.areaName && <span className="text-ink-soft"> {"\u00B7"} {r.areaName}</span>}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Section>
  );
}
