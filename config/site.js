export const siteConfig = {
  name: "Nairobi Eats",
  description:
    "Find restaurants in Nairobi by cuisine, location, budget, atmosphere, ratings and more.",
  defaultCitySlug: "nairobi",
  timezone: "Africa/Nairobi",
  currency: "KES",
  map: {
    defaultCenter: { lat: -1.2921, lng: 36.8219 },
    defaultZoom: 12,
  },
  // Cuisines, areas, vibes and amenities live in the database, not here.
  nav: [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "Map", href: "/map" },
    { label: "Offers", href: "/offers" },
    { label: "Events", href: "/events" },
    { label: "Favorites", href: "/favorites" },
    { label: "Account", href: "/account" },
  ],
};
