import Link from "next/link";
import Section from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { requirePageUser } from "@/lib/auth/guards";
import { listFavorites } from "@/lib/favorites";

export const metadata = { title: "Favorites", robots: { index: false, follow: false } };

export default async function FavoritesPage() {
  const user = await requirePageUser("/favorites");
  const restaurants = await listFavorites(user.id);

  return (
    <Section id="favorites" level={1} title="Your favorites" subtitle="Restaurants you've saved">
      {restaurants.length === 0 ? (
        <EmptyState title="No favorites yet">
          Tap the heart on any restaurant to save it here.{" "}
          <Link href="/explore" className="font-medium text-lantern hover:underline">Browse restaurants</Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {restaurants.map((r) => (
            <li key={r.id}><RestaurantCard restaurant={r} headingLevel={2} /></li>
          ))}
        </ul>
      )}
    </Section>
  );
}
