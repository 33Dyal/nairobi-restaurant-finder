import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/lib/auth/guards";

export const metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

const fmt = (d) =>
  d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });

function Stat({ label, value, href, alert = false }) {
  const card = (
    <div className={`h-full rounded-xl border bg-surface p-4 ${alert && value > 0 ? "border-amber-500/60" : "border-line"}`}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{card}</Link> : card;
}

export default async function AdminOverviewPage() {
  await requirePageRole(["ADMIN"], "/admin");

  const [
    byApproval,
    users,
    pendingReviews,
    openReports,
    pendingClaims,
    pendingVerifications,
    pendingOffers,
    pendingEvents,
    pending,
    activity,
  ] = await Promise.all([
    prisma.restaurant.groupBy({ by: ["approvalStatus"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.restaurantClaim.count({ where: { status: "PENDING" } }),
    prisma.verificationRequest.count({ where: { status: "PENDING" } }),
    prisma.offer.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.event.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.restaurant.findMany({
      where: { approvalStatus: "PENDING", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true, area: { select: { name: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, entityType: true, createdAt: true, actor: { select: { name: true } } },
    }),
  ]);

  const counts = Object.fromEntries(byApproval.map((g) => [g.approvalStatus, g._count._all]));
  const totalRestaurants = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink-soft">What needs your attention, and how the platform is doing.</p>
      </header>

      <section aria-labelledby="attention">
        <h2 id="attention" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Needs attention</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Restaurants awaiting approval" value={counts.PENDING ?? 0} href="/admin/restaurants?status=PENDING" alert />
          <Stat label="Ownership claims" value={pendingClaims} alert />
          <Stat label="Verification requests" value={pendingVerifications} alert />
          <Stat label="Open reports" value={openReports} alert />
          <Stat label="Reviews awaiting moderation" value={pendingReviews} alert />
          <Stat label="Offers awaiting approval" value={pendingOffers} alert />
          <Stat label="Events awaiting approval" value={pendingEvents} alert />
        </div>
      </section>

      <section aria-labelledby="totals">
        <h2 id="totals" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Platform</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Restaurants" value={totalRestaurants} href="/admin/restaurants" />
          <Stat label="Approved (public)" value={counts.APPROVED ?? 0} href="/admin/restaurants?status=APPROVED" />
          <Stat label="Rejected" value={counts.REJECTED ?? 0} href="/admin/restaurants?status=REJECTED" />
          <Stat label="Users" value={users} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="pending" className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="pending" className="font-semibold">Newest pending restaurants</h2>
            <Link href="/admin/restaurants?status=PENDING" className="text-sm text-lantern hover:underline">Review all</Link>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing is waiting for approval.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {pending.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-medium">{r.name}</span>
                  <span className="shrink-0 text-ink-soft">{r.area?.name} · {fmt(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="activity" className="rounded-xl border border-line bg-surface p-4">
          <h2 id="activity" className="mb-3 font-semibold">Recent admin activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-ink-soft">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {activity.map((a) => (
                <li key={a.id} className="py-2 text-sm">
                  <p><span className="font-medium">{a.action}</span> <span className="text-ink-soft">on {a.entityType}</span></p>
                  <p className="text-xs text-ink-faint">{a.actor?.name ?? "System"} · {fmt(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
