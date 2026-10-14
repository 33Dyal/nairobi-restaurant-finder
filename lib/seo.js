import { siteConfig } from "@/config/site";
import { clientEnv } from "@/lib/env";
import { PRICE_KES } from "@/lib/constants/labels";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const siteUrl = () => clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Search engines may index the site only in production on a real domain.
// On localhost and in development, pages are marked noindex and robots.txt blocks everything.
export function isIndexable() {
  return process.env.NODE_ENV === "production" && !/localhost|127\.0\.0\.1|\.local\b/i.test(siteUrl());
}

export function truncate(text, max = 160) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}\u2026`;
}

// Metadata for a page: title, description, canonical URL, and share cards.
// `path` is the page's own clean URL path, so filtered or sorted variants of a
// page all point search engines at one canonical address.
export function buildMetadata({ title, description, path, image, noindex = false }) {
  const fullTitle = `${title} | ${siteConfig.name}`;
  const text = truncate(description ?? siteConfig.description);
  return {
    title,
    description: text,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_KE",
      title: fullTitle,
      description: text,
      ...(path ? { url: path } : {}),
      ...(image ? { images: [{ url: absoluteUrl(image) }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: text,
      ...(image ? { images: [absoluteUrl(image)] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

// ---------- Structured data (JSON-LD) ----------

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteUrl(),
    description: siteConfig.description,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteUrl(),
    inLanguage: "en-KE",
  };
}

// items: [{ name, href }]. The last item is the current page and needs no href.
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

// `r` is the object returned by getRestaurantBySlug.
export function restaurantJsonLd(r) {
  const url = absoluteUrl(`/restaurants/${r.slug}`);
  const today = new Date().toISOString().slice(0, 10);

  const images = [r.coverUrl, ...r.images.map((i) => i.url)]
    .filter(Boolean)
    .filter((u, i, all) => all.indexOf(u) === i)
    .map((u) => absoluteUrl(u))
    .slice(0, 6);

  // Weekly hours. Days follow lib/hours.js: 0 = Sunday. A closing time at or before the
  // opening time means the restaurant closes after midnight.
  const weekly = r.schedule.periods.map(([day, opens, closes]) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: DAYS[day],
    opens,
    closes,
  }));

  // One-off days. A closed day is described as 00:00 to 00:00 for that single date.
  const special = r.schedule.special
    .filter((s) => s.date >= today)
    .map((s) => ({
      "@type": "OpeningHoursSpecification",
      opens: s.closed || !s.opens ? "00:00" : s.opens,
      closes: s.closed || !s.closes ? "00:00" : s.closes,
      validFrom: s.date,
      validThrough: s.date,
    }));

  const hours = [...weekly, ...special];
  const sameAs = [r.website, r.instagramUrl, r.facebookUrl, r.twitterUrl, r.tiktokUrl].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${url}#restaurant`,
    name: r.name,
    url,
    description: r.description ?? r.shortDescription ?? undefined,
    image: images.length ? images : undefined,
    telephone: r.phone ?? undefined,
    email: r.email ?? undefined,
    servesCuisine: r.cuisines.length ? r.cuisines : undefined,
    priceRange: PRICE_KES[r.priceRange] ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: r.address,
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    geo: { "@type": "GeoCoordinates", latitude: r.latitude, longitude: r.longitude },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`,
    openingHoursSpecification: hours.length ? hours : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    amenityFeature: r.amenities.length
      ? r.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a.name, value: true }))
      : undefined,
    hasMenu: r.menus.length ? `${url}#menu` : undefined,
    aggregateRating:
      r.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(r.averageRating.toFixed(1)),
            reviewCount: r.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}
