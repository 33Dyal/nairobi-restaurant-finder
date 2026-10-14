import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/lib/auth/guards";
import RestaurantActions from "@/components/admin/RestaurantActions";

export const metadata = { title: "Restaurants · Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const BADGE = {
  PENDING: "bg-amber-500/15 text-amber-300",
  APPROVED: "bg-emerald-500/15 text-emerald-300",
  VERIFIED: "bg-emerald-500/15 text-emerald-300",
  REJECTED: "bg-red-500/15 text-red-300",
  SUSPENDED: "bg-red-500/15 text-red-300",
};

const label = (v) => v.charAt(0) + v.slice(1).toLowerCase();

function Badge({ value }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[value] ?? "bg-white/10"}`}>{label(value)}</span>
  );
}

function buildHref({ q, status, page }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "ALL") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/restaurants${qs ? `?${qs}` : ""}`;
}

const fmt = (d) => d.toLocaleDateString("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" });

export default async function AdminRestaurantsPage({ searchParams }) {
  await requirePageRole(["ADMIN"], "/admin/restaurants");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100);
  const status = STATUSES.includes(sp.status) ? sp.status : "ALL";
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);

  const where = {
    deletedAt: null,
    ...(status !== "ALL" ? { approvalStatus: status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { area: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.restaurant.count({ where }),
    prisma.restaurant.findMany({
      where,
      // Enum order is PENDING, APPROVED, REJECTED, so pending ones come first.
      orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        isDemo: true,
        isFeatured: true,
        approvalStatus: true,
        verificationStatus: true,
        averageRating: true,
        reviewCount: true,
        createdAt: true,
        area: { select: { name: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Restaurants</h1>
        <p className="text-sm text-ink-soft">{total} {total === 1 ? "restaurant" : "restaurants"} match your filters.</p>
      </header>

      <form role="search" className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="admin-q" className="sr-only">Search restaurants</label>
        <input
          id="admin-q"
          name="q"
          defaultValue={q}
          placeholder="Search name, address or area"
          className="min-h-11 flex-1 rounded-lg border border-field bg-surface px-3 text-sm"
        />
        {status !== "ALL" && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="min-h-11 rounded-lg bg-white px-5 text-sm font-semibold text-black">Search</button>
      </form>

      <nav aria-label="Filter by approval status" className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref({ q, status: s, page: 1 })}
            aria-current={s === status ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm ${s === status ? "border-white bg-white text-black" : "border-line hover:bg-surface"}`}
          >
            {s === "ALL" ? "All" : label(s)}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-soft">No restaurants match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <caption className="sr-only">Restaurants</caption>
            <thead className="bg-surface text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th scope="col" className="px-4 py-3">Restaurant</th>
                <th scope="col" className="px-4 py-3">Approval</th>
                <th scope="col" className="px-4 py-3">Verification</th>
                <th scope="col" className="px-4 py-3">Featured</th>
                <th scope="col" className="px-4 py-3">Rating</th>
                <th scope="col" className="px-4 py-3">Added</th>
                <th scope="col" className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    <Link href={`/restaurants/${r.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{r.name}<span className="sr-only"> (opens in a new tab)</span></Link>
                    {r.isDemo && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs text-ink-soft">Demo</span>}
                    <p className="text-xs text-ink-soft">{r.area?.name}</p>
                  </td>
                  <td className="px-4 py-3"><Badge value={r.approvalStatus} /></td>
                  <td className="px-4 py-3"><Badge value={r.verificationStatus} /></td>
                  <td className="px-4 py-3">{r.isFeatured ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.reviewCount > 0 ? `${r.averageRating.toFixed(1)} (${r.reviewCount})` : "No reviews"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/restaurants/${r.id}`} className="mb-2 inline-block text-xs font-medium text-lantern hover:underline">Edit details</Link>
                    <RestaurantActions
                      id={r.id}
                      approvalStatus={r.approvalStatus}
                      verificationStatus={r.verificationStatus}
                      isFeatured={r.isFeatured}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={buildHref({ q, status, page: page - 1 })} className="rounded-lg border border-line px-3 py-2 hover:bg-surface">Previous</Link>
          ) : <span />}
          <span className="text-ink-soft">Page {page} of {pages}</span>
          {page < pages ? (
            <Link href={buildHref({ q, status, page: page + 1 })} className="rounded-lg border border-line px-3 py-2 hover:bg-surface">Next</Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
