import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Accessibility, BadgeCheck, Car, Globe, MapPin, Navigation, Phone, Star } from "lucide-react";
import Section from "@/components/ui/Section";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import OfferCard from "@/components/offers/OfferCard";
import EventCard from "@/components/events/EventCard";
import OpenStatus from "@/components/restaurant/OpenStatus";
import FavoriteButton from "@/components/restaurant/FavoriteButton";
import WeeklyHours from "@/components/restaurant/WeeklyHours";
import { PriceRange } from "@/components/restaurant/RestaurantCard";
import { getOpenStatus } from "@/lib/hours";
import { formatRating, formatReviewCount } from "@/lib/format";
import { getRestaurantBySlug, recordProfileView } from "@/lib/data/restaurant";
import { buildMetadata, restaurantJsonLd } from "@/lib/seo";

// Rendered on every request so each visit is counted and "open now" is correct.
export const dynamic = "force-dynamic";

const ksh = (n) => `KSh ${Number(n).toLocaleString("en-KE")}`;
const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold";

// Screen-reader hint for links that open a new tab.
const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

export async function generateMetadata({ params }) {
  const r = await getRestaurantBySlug((await params).slug);
  if (!r) return { title: "Restaurant not found", robots: { index: false, follow: false } };

  const cuisine = r.cuisines[0];
  const title = cuisine ? `${r.name} \u2013 ${cuisine} in ${r.area.name}` : `${r.name} in ${r.area.name}`;
  const description =
    r.shortDescription ??
    r.description ??
    `${r.name} is a ${cuisine ? `${cuisine} ` : ""}restaurant in ${r.area.name}, Nairobi. See the menu, opening hours, photos and directions.`;
  // Share cards can't use SVG images (the sample listings use them), so those fall back to the site image.
  const cover = r.coverUrl && !/\.svg(\?|$)/i.test(r.coverUrl) ? r.coverUrl : null;

  // Sample (demo) listings stay out of search results.
  return buildMetadata({ title, description, path: `/restaurants/${r.slug}`, image: cover, noindex: r.isDemo });
}

export default async function RestaurantPage({ params }) {
  const r = await getRestaurantBySlug((await params).slug);
  if (!r) notFound();

  after(() => recordProfileView(r.id));

  const rating = formatRating(r.averageRating, r.reviewCount);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`;
  const socials = [
    ["Instagram", r.instagramUrl], ["Facebook", r.facebookUrl], ["X", r.twitterUrl], ["TikTok", r.tiktokUrl],
  ].filter(([, url]) => url);
  const gallery = r.images.filter((i) => i.url !== r.coverUrl);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/explore" },
    { name: r.area.name, href: `/explore?area=${r.area.slug}` },
    { name: r.name },
  ];

  return (
    <>
      <JsonLd data={restaurantJsonLd(r)} />

      {/* Hero */}
      <header className="relative border-b border-line">
        <div className="relative h-56 w-full overflow-hidden bg-jacaranda-100 sm:h-72 lg:h-80">
          {r.coverUrl ? (
            <Image src={r.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-jacaranda-100 to-jacaranda-500/40" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden="true" />
          {r.isDemo && (
            <span className="absolute left-4 top-4 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">Sample listing</span>
          )}
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <Breadcrumbs items={crumbs} className="mb-4" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold leading-tight">
                {r.name}
                {r.verified && (
                  <>
                    <BadgeCheck className="ml-2 inline h-6 w-6 -translate-y-0.5 text-jacaranda-600" aria-hidden="true" />
                    <span className="sr-only"> (verified)</span>
                  </>
                )}
              </h1>
              <p className="mt-1 text-ink-soft">{r.cuisines.slice(0, 3).join(" \u00B7 ")}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
                <p className="flex items-center gap-1 font-semibold text-ink">
                  <Star className={rating.isNew ? "h-4 w-4 text-ink-faint" : "h-4 w-4 fill-lantern text-lantern"} aria-hidden="true" />
                  {rating.text}
                  {!rating.isNew && <span className="font-normal text-ink-faint">({formatReviewCount(r.reviewCount)})</span>}
                </p>
                <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{r.area.name}</p>
                <PriceRange value={r.priceRange} />
                <OpenStatus schedule={r.schedule} initial={getOpenStatus(r.schedule)} />
              </div>
            </div>
            <FavoriteButton restaurantId={r.id} name={r.name} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href={directions} target="_blank" rel="noopener noreferrer" className={`${btn} bg-jacaranda-600 text-black hover:bg-jacaranda-700`}>
              <Navigation className="h-4 w-4" aria-hidden="true" />Directions<NewTab />
            </a>
            {r.phone && (
              <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className={`${btn} border border-line hover:bg-surface`}>
                <Phone className="h-4 w-4" aria-hidden="true" />Call
              </a>
            )}
            {r.website && (
              <a href={r.website} target="_blank" rel="noopener noreferrer" className={`${btn} border border-line hover:bg-surface`}>
                <Globe className="h-4 w-4" aria-hidden="true" />Website<NewTab />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* About */}
      <Section id="about" title={`About ${r.name}`}>
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <p className="whitespace-pre-line text-ink-soft">{r.description ?? r.shortDescription ?? "No description yet."}</p>
            {r.vibes.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Vibes">
                {r.vibes.map((v) => (
                  <li key={v.slug}>
                    <Link href={`/explore?vibe=${v.slug}`} className="rounded-full border border-line px-3 py-1 text-sm hover:bg-surface">{v.name}</Link>
                  </li>
                ))}
              </ul>
            )}
            {r.amenities.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Good to know</h3>
                <ul className="flex flex-wrap gap-2 text-sm text-ink-soft">
                  {r.amenities.map((a) => <li key={a.name} className="rounded-md bg-surface px-2.5 py-1">{a.name}</li>)}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-3 rounded-2xl border border-line bg-surface p-4 text-sm">
            <h3 className="font-semibold">Location &amp; contact</h3>
            <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{r.address}{r.landmark ? ` (near ${r.landmark})` : ""}</span></p>
            {r.parkingInfo && <p className="flex gap-2"><Car className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{r.parkingInfo}</span></p>}
            {r.accessibilityInfo && <p className="flex gap-2"><Accessibility className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{r.accessibilityInfo}</span></p>}
            {r.phone && <p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">{r.phone}</a></p>}
            {r.email && <p><a href={`mailto:${r.email}`} className="text-lantern hover:underline">{r.email}</a></p>}
            {socials.length > 0 && (
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                {socials.map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="text-lantern hover:underline">{label}<NewTab /></a>
                ))}
              </p>
            )}
          </aside>
        </div>
      </Section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <Section id="photos" title="Photos">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((img) => (
              <li key={img.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-jacaranda-100">
                <Image src={img.url} alt={img.caption ?? `${r.name} photo`} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Offers & events */}
      {r.offers.length > 0 && (
        <Section id="offers" title="Current offers">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {r.offers.map((o) => <li key={o.id}><OfferCard offer={o} /></li>)}
          </ul>
        </Section>
      )}
      {r.events.length > 0 && (
        <Section id="events" title="Upcoming events">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {r.events.map((e) => <li key={e.id}><EventCard event={e} /></li>)}
          </ul>
        </Section>
      )}

      {/* Menu */}
      <Section id="menu" title="Menu" subtitle="Prices are a guide and may change">
        {r.menus.length === 0 ? (
          <p className="text-sm text-ink-soft">This restaurant hasn&apos;t added a menu yet.</p>
        ) : (
          <div className="space-y-8">
            {r.menus.map((menu) => (
              <div key={menu.id} className="space-y-6">
                {r.menus.length > 1 && <h3 className="font-display text-xl font-bold">{menu.name}</h3>}
                {menu.categories.map((cat) => (
                  <div key={cat.id}>
                    <h4 className="mb-2 border-b border-line pb-1 font-semibold">{cat.name}</h4>
                    <ul className="divide-y divide-line">
                      {cat.items.map((item) => (
                        <li key={item.id} className={`flex justify-between gap-4 py-3 ${item.isAvailable ? "" : "opacity-50"}`}>
                          <div className="min-w-0">
                            <p className="font-medium">
                              {item.name}
                              {item.isSpicy && <span className="ml-2 text-xs text-red-400">Spicy</span>}
                              {!item.isAvailable && <span className="ml-2 text-xs text-ink-faint">Unavailable</span>}
                            </p>
                            {item.description && <p className="text-sm text-ink-soft">{item.description}</p>}
                            {item.dietaryTags.length > 0 && <p className="mt-0.5 text-xs text-ink-faint">{item.dietaryTags.join(" \u00B7 ")}</p>}
                          </div>
                          <p className="shrink-0 font-semibold">{ksh(item.price)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Hours */}
      <Section id="hours" title="Opening hours">
        <div className="max-w-md">
          <WeeklyHours periods={r.schedule.periods} special={r.schedule.special} />
        </div>
      </Section>

      {/* Reviews: written reviews are the next feature */}
      <Section id="reviews" title="Reviews">
        <p className="text-ink-soft">
          {rating.isNew ? "No reviews yet." : `Rated ${rating.text} out of 5 from ${formatReviewCount(r.reviewCount)}.`}
        </p>
      </Section>
      <div className="h-8" />
    </>
  );
}
