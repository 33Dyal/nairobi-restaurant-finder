import Section from "@/components/ui/Section";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import OfferCard from "@/components/offers/OfferCard";
import Pagination from "@/components/search/Pagination";
import { listOffers } from "@/lib/data/discovery";

import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({ title: "Offers", description: "Current deals and specials from restaurants in Nairobi.", path: "/offers" });

export default async function OffersPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.min(500, Math.max(1, parseInt(sp?.page, 10) || 1));
  const { items, totalPages } = await listOffers({ page });

  return (
    <Section
      id="offers"
      level={1}
      title="Current offers"
      subtitle="Deals and specials from restaurants"
      breadcrumbs={<Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Offers" }]} />}
    >
      {items.length === 0 ? (
        <EmptyState title="No offers right now">Check back soon for new deals.</EmptyState>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((o) => (
              <li key={o.id}><OfferCard offer={o} headingLevel={2} /></li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} searchParams={sp} basePath="/offers" />
        </>
      )}
    </Section>
  );
}
