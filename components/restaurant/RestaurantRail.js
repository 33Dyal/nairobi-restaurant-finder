import Section from "@/components/ui/Section";
import RestaurantCard from "./RestaurantCard";

// Horizontally scrolling row of cards. Renders nothing when there is nothing to show.
export default function RestaurantRail({ id, title, subtitle, href, restaurants }) {
  if (!restaurants?.length) return null;
  return (
    <Section id={id} title={title} subtitle={subtitle} href={href}>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {restaurants.map((r) => (
          <li key={r.id} className="w-[270px] shrink-0 snap-start">
            <RestaurantCard restaurant={r} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
