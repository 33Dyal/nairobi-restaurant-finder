import ChatLauncher from "@/components/ai/ChatLauncher";
import Hero from "@/components/home/Hero";
import CategoryChips from "@/components/home/CategoryChips";
import PopularSearches from "@/components/home/PopularSearches";
import RestaurantRail from "@/components/restaurant/RestaurantRail";
import OfferCard from "@/components/offers/OfferCard";
import EventCard from "@/components/events/EventCard";
import Section from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { getHomepageData } from "@/lib/data/public";

// Rebuilt at most every 5 minutes. Open/closed labels are recomputed in the
// browser, so they stay accurate even though the page itself is cached.
export const revalidate = 300;

export default async function HomePage() {
  const { featured, trending, newest, topRated, filters, offers, events, popularSearches } = await getHomepageData();
  const hasRestaurants = featured.length + trending.length + newest.length + topRated.length > 0;

  return (
    <>
      <Hero filters={filters} />

      {!hasRestaurants && (
        <Section id="empty" title="Restaurants">
          <EmptyState title="No restaurants to show yet">
            Restaurants appear here once they are approved. If you are setting up a new database, run <code>npm run db:seed</code> to load sample data.
          </EmptyState>
        </Section>
      )}

      <RestaurantRail id="featured" title="Featured restaurants" subtitle="Hand-picked places worth a visit" href="/explore?featured=1" restaurants={featured} />
      <RestaurantRail id="trending" title="Trending restaurants" subtitle="Most viewed over the last two weeks" href="/explore?sort=trending" restaurants={trending} />
      <RestaurantRail id="newest" title="Newly added" subtitle="Fresh on Nairobi Eats" href="/explore?sort=newest" restaurants={newest} />
      <RestaurantRail id="top-rated" title="Highly rated" subtitle="Best reviewed by diners" href="/explore?sort=rating" restaurants={topRated} />

      <CategoryChips id="by-cuisine" title="Browse by cuisine" param="cuisine" items={filters.cuisines} />
      <CategoryChips id="by-area" title="Browse by area" subtitle="Find somewhere close to you" param="area" items={filters.areas} />
      <CategoryChips id="by-vibe" title="Browse by vibe" subtitle="Date night, rooftop, family lunch and more" param="vibe" items={filters.vibes} />

      {offers.length > 0 && (
        <Section id="offers" title="Current offers" subtitle="Deals and specials from restaurants" href="/offers">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offers.map((o) => <li key={o.id}><OfferCard offer={o} /></li>)}
          </ul>
        </Section>
      )}

      {events.length > 0 && (
        <Section id="events" title="Upcoming events" subtitle="Live music, festivals and special nights" href="/events">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((e) => <li key={e.id}><EventCard event={e} /></li>)}
          </ul>
        </Section>
      )}

      <PopularSearches searches={popularSearches} />
      <div className="h-8" />

      <ChatLauncher />
    </>
  );
}