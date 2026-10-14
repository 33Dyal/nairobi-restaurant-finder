import Section from "@/components/ui/Section";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import Pagination from "@/components/search/Pagination";
import { listEvents } from "@/lib/data/discovery";

import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({ title: "Events", description: "Live music, festivals, themed nights and special dining events at restaurants across Nairobi.", path: "/events" });

export default async function EventsPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.min(500, Math.max(1, parseInt(sp?.page, 10) || 1));
  const { items, totalPages } = await listEvents({ page });

  return (
    <Section
      id="events"
      level={1}
      title="Upcoming events"
      subtitle="Live music, tastings and special nights at Nairobi restaurants"
      breadcrumbs={<Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Events" }]} />}
    >
      {items.length === 0 ? (
        <EmptyState title="No events right now">Check back soon for upcoming events.</EmptyState>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((e) => (
              <li key={e.id}>
                <EventCard event={e} headingLevel={2} />
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} searchParams={sp} basePath="/events" />
        </>
      )}
    </Section>
  );
}
