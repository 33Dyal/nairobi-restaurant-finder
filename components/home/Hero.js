import Link from "next/link";
import Image from "next/image";
import HeroSearch from "@/components/search/HeroSearch";
import { SEARCH_EXAMPLES } from "@/lib/constants/labels";

// Quick filters only offer choices that have at least one public restaurant,
// so people never land on an empty result.
const withRestaurants = (rows) => rows.filter((r) => r.count > 0);

export default function Hero({ filters }) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-black text-white">
      {/* Background photo with a dark layer on top so the text stays easy to read */}
      <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />

      <div className="relative px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
        <h1 id="hero-title" className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Discover the Best Restaurants in Nairobi
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
          Find restaurants by cuisine, location, budget, atmosphere, ratings and more.
        </p>

        <div className="mt-8">
          <HeroSearch cuisines={withRestaurants(filters.cuisines)} areas={withRestaurants(filters.areas)} vibes={withRestaurants(filters.vibes)} />
        </div>

        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Example searches">
          {SEARCH_EXAMPLES.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="inline-flex min-h-9 items-center rounded-full border border-white/25 px-3.5 text-sm text-white/90 hover:bg-white/10">
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}