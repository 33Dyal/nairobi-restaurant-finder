import "server-only";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_RESTAURANT, cardSelect, toCard } from "@/lib/data/public";
import { getFacets } from "@/lib/search";
import { getOpenStatus } from "@/lib/hours";
import { intentSchema, parseWithModel, parseWithRules, sanitize, describeIntent } from "@/lib/ai/intent";

const RESULT_LIMIT = 6;

const ORDER = {
  relevance: [{ isFeatured: "desc" }, { averageRating: "desc" }, { reviewCount: "desc" }],
  rating: [{ averageRating: "desc" }, { reviewCount: "desc" }],
  newest: [{ createdAt: "desc" }],
};

// A keyword must appear in the name, description, address, area or a cuisine name.
function keywordClause(keyword) {
  const m = { contains: keyword, mode: "insensitive" };
  return {
    OR: [
      { name: m },
      { shortDescription: m },
      { address: m },
      { area: { name: m } },
      { cuisines: { some: { cuisine: { name: m } } } },
    ],
  };
}

// Filters combine with AND across groups and OR within a group (same as search).
function buildWhere(intent) {
  const and = [];
  if (intent.cuisines.length) and.push({ cuisines: { some: { cuisine: { slug: { in: intent.cuisines } } } } });
  if (intent.areas.length) and.push({ area: { slug: { in: intent.areas } } });
  if (intent.vibes.length) and.push({ vibes: { some: { vibe: { slug: { in: intent.vibes } } } } });
  if (intent.prices.length) and.push({ priceRange: { in: intent.prices } });
  if (intent.minRating > 0) and.push({ averageRating: { gte: intent.minRating } });
  for (const keyword of intent.keywords) and.push(keywordClause(keyword));
  return { ...PUBLIC_RESTAURANT, ...(and.length ? { AND: and } : {}) };
}

async function runQuery(intent) {
  const now = new Date();
  const rows = await prisma.restaurant.findMany({
    where: buildWhere(intent),
    orderBy: ORDER[intent.sort] ?? ORDER.relevance,
    take: intent.openNow ? 40 : RESULT_LIMIT, // open-now is computed in code, so fetch extra
    select: cardSelect(now),
  });
  let cards = rows.map(toCard);
  if (intent.openNow) cards = cards.filter((c) => getOpenStatus(c.schedule, now).isOpen);
  return cards.slice(0, RESULT_LIMIT);
}

// Soft filters are dropped one at a time, in this order. Cuisine and keywords never are.
const LADDER = ["prices", "minRating", "vibes", "openNow", "areas"];
const EMPTY = { prices: [], minRating: 0, vibes: [], openNow: false, areas: [] };
const LABEL = {
  prices: "your budget",
  minRating: "the rating requirement",
  vibes: "the vibe",
  openNow: "“open now”",
  areas: "the area",
};

function isSet(intent, key) {
  if (key === "minRating") return intent.minRating > 0;
  if (key === "openNow") return intent.openNow;
  return intent[key].length > 0;
}

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

async function searchWithRelaxing(intent) {
  let restaurants = await runQuery(intent);
  if (restaurants.length) return { restaurants, dropped: [], exact: true };

  let current = intent;
  const dropped = [];
  for (const key of LADDER) {
    if (!isSet(current, key)) continue;
    current = { ...current, [key]: EMPTY[key] };
    dropped.push(key);
    restaurants = await runQuery(current);
    if (restaurants.length) return { restaurants, dropped, exact: false };
  }
  return { restaurants: [], dropped, exact: false };
}

export async function recommend(query) {
  const facets = await getFacets();
  const raw = await parseWithModel(query, facets);
  const parsed = raw ? intentSchema.safeParse(raw) : null;
  const source = parsed?.success ? "ai" : "rules";
  const base = parsed?.success ? parsed.data : parseWithRules(query, facets);

  if (base.isRestaurantRequest === false) {
    return {
      message: "I can help you find restaurants. Try a cuisine, an area or a vibe, like “cheap Italian in Westlands”.",
      restaurants: [],
      understood: [],
      exact: true,
      source,
    };
  }

  const clean = sanitize(base, facets) ?? base;
  const intent = {
    ...clean,
    cuisines: clean.cuisines ?? [],
    areas: clean.areas ?? [],
    vibes: clean.vibes ?? [],
    prices: clean.prices ?? [],
    keywords: clean.keywords ?? [],
    minRating: clean.minRating ?? 0,
    openNow: clean.openNow ?? false,
    sort: clean.sort ?? "relevance",
  };

  const understood = [].concat(describeIntent(intent, facets) ?? []);
  if (!understood.length) {
    return {
      message: "Tell me what you feel like, such as a cuisine, an area or a vibe, and I'll find places.",
      restaurants: [],
      understood: [],
      exact: true,
      source,
    };
  }

  const { restaurants, dropped, exact } = await searchWithRelaxing(intent);
  const count = restaurants.length;
  const summary = understood.join(", ");

  let message;
  if (count === 0) {
    message = `Nothing in our listings matches ${summary} yet. Try a different cuisine or area.`;
  } else if (exact) {
    message = `Found ${count} restaurant${count === 1 ? "" : "s"} matching ${summary}.`;
  } else {
    message = `Nothing in our listings matches everything you asked for (${summary}). These are the closest matches, without ${joinList(dropped.map((k) => LABEL[k]))}.`;
  }

  return { message, restaurants, understood, exact, source };
}