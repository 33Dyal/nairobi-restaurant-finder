/* Seeds reference data (city, areas, cuisines, vibes, amenities) and SAMPLE demo data.
   Safe to re-run: demo restaurants and demo users are removed and recreated.
   Run with: npm run db:seed */
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
dotenv.config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { buildSeedData } = require("./seed-data");

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Refusing to seed demo accounts in production. Set ALLOW_DEMO_SEED=true to override.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const byKey = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], r]));

async function main() {
  const now = new Date();
  const d = buildSeedData(now);
  console.log("Seeding reference data...");

  const city = await prisma.city.upsert({ where: { slug: d.city.slug }, update: d.city, create: d.city });

  for (const a of d.areas) {
    await prisma.area.upsert({ where: { cityId_slug: { cityId: city.id, slug: a.slug } }, update: a, create: { ...a, cityId: city.id } });
  }
  for (const c of d.cuisines) await prisma.cuisine.upsert({ where: { slug: c.slug }, update: c, create: c });
  for (const v of d.vibes) await prisma.vibe.upsert({ where: { slug: v.slug }, update: v, create: v });
  for (const a of d.amenities) await prisma.amenity.upsert({ where: { slug: a.slug }, update: a, create: a });

  const areas = byKey(await prisma.area.findMany({ where: { cityId: city.id } }), "slug");
  const cuisines = byKey(await prisma.cuisine.findMany(), "slug");
  const vibes = byKey(await prisma.vibe.findMany(), "slug");
  const amenities = byKey(await prisma.amenity.findMany(), "slug");

  console.log("Removing previous demo data...");
  await prisma.restaurant.deleteMany({ where: { isDemo: true } });
  await prisma.user.deleteMany({ where: { email: { in: d.users.map((u) => u.email) } } });
  await prisma.searchHistory.deleteMany({ where: { userId: null } });

  console.log("Creating demo users...");
  const passwordHash = await bcrypt.hash(d.password, 10);
  const users = {};
  for (const u of d.users) {
    users[u.key] = await prisma.user.create({
      data: { email: u.email, name: u.name, role: u.role, passwordHash, emailVerifiedAt: now },
    });
  }

  console.log("Creating restaurants, menus and hours...");
  const restaurants = {};
  for (const r of d.restaurants) {
    restaurants[r.slug] = await prisma.restaurant.create({
      data: {
        slug: r.slug, name: r.name, shortDescription: r.shortDescription, description: r.description,
        cityId: city.id, areaId: areas[r.areaSlug].id, address: r.address, landmark: r.landmark,
        latitude: r.latitude, longitude: r.longitude, priceRange: r.priceRange,
        phone: r.phone, email: r.email, website: r.website, coverUrl: r.coverUrl,
        parkingInfo: r.parkingInfo, accessibilityInfo: r.accessibilityInfo,
        approvalStatus: r.approvalStatus, verificationStatus: r.verificationStatus,
        operatingStatus: r.operatingStatus, isFeatured: r.isFeatured, isDemo: true,
        verifiedAt: r.verificationStatus === "VERIFIED" ? now : null,
        createdAt: r.createdAt,
        cuisines: { create: r.cuisineSlugs.map((s, i) => ({ cuisineId: cuisines[s].id, isPrimary: i === 0 })) },
        vibes: { create: r.vibeSlugs.map((s) => ({ vibeId: vibes[s].id })) },
        amenities: { create: r.amenitySlugs.map((s) => ({ amenityId: amenities[s].id })) },
        images: { create: r.images },
        openingPeriods: { create: r.openingPeriods },
        menus: { create: [{ name: r.menu.name, categories: { create: r.menu.categories.map((c) => ({ name: c.name, sortOrder: c.sortOrder, items: { create: c.items } })) } }] },
        staff: r.ownedByDemoOwner ? { create: [{ userId: users.owner.id, role: "OWNER" }] } : undefined,
      },
    });
  }

  console.log("Creating reviews...");
  const reviewRows = {};
  for (const rv of d.reviews) {
    const created = await prisma.review.create({
      data: {
        userId: users[rv.userKey].id, restaurantId: restaurants[rv.restaurantSlug].id, rating: rv.rating,
        body: rv.body, createdAt: rv.createdAt, helpfulCount: rv.voterKeys.length,
        ownerResponse: rv.ownerResponse, ownerResponseAt: rv.ownerResponse ? now : null,
        votes: { create: rv.voterKeys.map((k) => ({ userId: users[k].id })) },
      },
    });
    reviewRows[`${rv.restaurantSlug}:${rv.userKey}`] = created;
  }

  // Keep denormalised rating counters consistent with the review rows.
  const stats = await prisma.review.groupBy({ by: ["restaurantId"], where: { status: "PUBLISHED" }, _avg: { rating: true }, _count: { _all: true } });
  for (const s of stats) {
    await prisma.restaurant.update({ where: { id: s.restaurantId }, data: { averageRating: Math.round(s._avg.rating * 10) / 10, reviewCount: s._count._all } });
  }

  console.log("Creating offers, events and special hours...");
  for (const o of d.offers) {
    const { restaurantSlug, ...rest } = o;
    await prisma.offer.create({ data: { ...rest, restaurantId: restaurants[restaurantSlug].id } });
  }
  for (const e of d.events) {
    const { restaurantSlug, ...rest } = e;
    await prisma.event.create({ data: { ...rest, restaurantId: restaurants[restaurantSlug].id } });
  }
  for (const h of d.specialHours) {
    const { restaurantSlug, ...rest } = h;
    await prisma.specialHours.create({ data: { ...rest, restaurantId: restaurants[restaurantSlug].id } });
  }

  console.log("Creating customer data, analytics and moderation samples...");
  const customer = users.customer;
  await prisma.userPreference.create({ data: { userId: customer.id, budget: "MID_RANGE", cuisineSlugs: ["italian", "kenyan"], areaSlugs: ["kilimani", "westlands"], vibeSlugs: ["date-night"], dietary: [] } });
  for (const s of d.favorites) {
    await prisma.favorite.create({ data: { userId: customer.id, restaurantId: restaurants[s].id } });
    await prisma.restaurant.update({ where: { id: restaurants[s].id }, data: { favoriteCount: { increment: 1 } } });
  }
  for (const s of d.recentlyViewed) await prisma.recentlyViewed.create({ data: { userId: customer.id, restaurantId: restaurants[s].id } });
  for (const l of d.savedLocations) {
    const a = areas[l.areaSlug];
    await prisma.savedLocation.create({ data: { userId: customer.id, label: l.label, areaId: a.id, latitude: a.latitude, longitude: a.longitude } });
  }
  await prisma.notification.createMany({ data: [
    { userId: customer.id, type: "NEW_OFFER", title: "New offer at Jacaranda Rooftop Kitchen", body: "Sunset Happy Hour is now live.", linkUrl: "/offers" },
    { userId: customer.id, type: "NEW_EVENT", title: "Rooftop Jazz Evening", body: "A new event was added at a restaurant you saved.", linkUrl: "/events" },
    { userId: customer.id, type: "ANNOUNCEMENT", title: "Welcome to Nairobi Eats", body: "This account uses sample data for testing.", linkUrl: "/" },
  ] });

  await prisma.analyticsEvent.createMany({ data: d.analytics.map(({ restaurantSlug, ...a }) => ({ ...a, restaurantId: restaurants[restaurantSlug].id })) });
  await prisma.searchHistory.createMany({ data: d.searches });
  const views = await prisma.analyticsEvent.groupBy({ by: ["restaurantId"], where: { type: "PROFILE_VIEW" }, _count: { _all: true } });
  for (const v of views) await prisma.restaurant.update({ where: { id: v.restaurantId }, data: { viewCount: v._count._all } });

  await prisma.restaurantClaim.create({ data: { restaurantId: restaurants["sunrise-bakehouse"].id, userId: users.owner.id, businessRole: "Manager", message: "Sample claim request for demo purposes.", contactPhone: "+254 700 000 999" } });
  await prisma.verificationRequest.create({ data: { restaurantId: restaurants["acacia-grill-house"].id, requestedById: users.owner.id, notes: "Sample verification request." } });
  await prisma.report.create({ data: { reporterId: customer.id, targetType: "RESTAURANT", reason: "CLOSED_RESTAURANT", details: "Sample report for demo purposes.", restaurantId: restaurants["dragon-pearl"].id } });
  await prisma.auditLog.createMany({ data: [
    { actorId: users.admin.id, action: "restaurant.approve", entityType: "Restaurant", entityId: restaurants["savannah-steakhouse"].id },
    { actorId: users.admin.id, action: "restaurant.verify", entityType: "Restaurant", entityId: restaurants["jacaranda-rooftop-kitchen"].id },
    { actorId: users.admin.id, action: "restaurant.reject", entityType: "Restaurant", entityId: restaurants["kileleshwa-wine-and-tapas"].id },
  ] });

  console.log("\nSeed complete.");
  console.log(`  ${d.restaurants.length} sample restaurants, ${d.reviews.length} reviews, ${d.offers.length} offers, ${d.events.length} events`);
  console.log("  Demo logins (password from SEED_PASSWORD, default Demo@12345):");
  console.log("    customer@example.com, owner@example.com, admin@example.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
