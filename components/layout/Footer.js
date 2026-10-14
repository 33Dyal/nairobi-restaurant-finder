import Link from "next/link";
import { siteConfig } from "@/config/site";

// pb-20 on mobile keeps the last row clear of the fixed bottom navigation bar.
export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface pb-20 md:pb-0">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-ink-soft sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}. Restaurant discovery for Nairobi.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/explore" className="hover:text-ink">Explore</Link>
          <Link href="/map" className="hover:text-ink">Map</Link>
          <Link href="/offers" className="hover:text-ink">Offers</Link>
          <Link href="/events" className="hover:text-ink">Events</Link>
          <Link href="/recommend" className="hover:text-ink">Ask for a recommendation</Link>
          <Link href="/list-your-restaurant" className="hover:text-ink">List your restaurant</Link>
        </nav>
      </div>
    </footer>
  );
}
