import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/lib/auth/guards";

export const metadata = { title: "Owner dashboard" };
export const dynamic = "force-dynamic";

const STATUS = {
  PENDING: {
    label: "Awaiting approval",
    note: "Not on the site yet. An admin will review it.",
    cls: "bg-amber-500/15 text-amber-300",
  },
  APPROVED: { label: "Live", note: "Visible to diners.", cls: "bg-emerald-500/15 text-emerald-300" },
  REJECTED: {
    label: "Not approved",
    note: "Hidden from the site. Contact an admin for details.",
    cls: "bg-red-500/15 text-red-300",
  },
};

export default async function OwnerPage({ searchParams }) {
  const user = await requirePageRole(["OWNER", "ADMIN"], "/owner");
  const sp = await searchParams;

  const memberships = await prisma.restaurantStaff.findMany({
    where: { userId: user.id, restaurant: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    select: {
      role: true,
      restaurant: {
        select: {
          id: true,
          slug: true,
          name: true,
          approvalStatus: true,
          verificationStatus: true,
          area: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My restaurants</h1>
          <p className="text-sm text-ink-soft">Listings you own or manage.</p>
        </div>
        <Link href="/owner/restaurants/new" className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black">
          Add a restaurant
        </Link>
      </header>

      {sp.created === "1" && (
        <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Your restaurant was submitted. It will go live once an admin approves it.
        </p>
      )}

      {user.role === "ADMIN" && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
          You are signed in as an admin. Manage every restaurant from the{" "}
          <Link href="/admin/restaurants" className="text-lantern hover:underline">admin dashboard</Link>.
        </p>
      )}

      {memberships.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="font-medium">You don&apos;t have any restaurants yet.</p>
          <p className="mt-1 text-sm text-ink-soft">Add your restaurant and an admin will review it before it appears on the site.</p>
          <Link href="/owner/restaurants/new" className="mt-4 inline-block text-sm font-medium text-lantern hover:underline">
            Add your first restaurant
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {memberships.map(({ role, restaurant: r }) => {
            const status = STATUS[r.approvalStatus];
            return (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="text-sm text-ink-soft">{r.area?.name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                </div>
                <p className="mt-3 text-sm text-ink-soft">{status.note}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
                  <span>{role === "OWNER" ? "Owner" : "Manager"}</span>
                  <span className="flex gap-3">
                    <Link href={`/owner/restaurants/${r.id}`} className="font-medium text-lantern hover:underline">Edit details</Link>
                    {r.approvalStatus === "APPROVED" && (
                      <Link href={`/restaurants/${r.slug}`} className="text-lantern hover:underline">View public page</Link>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}