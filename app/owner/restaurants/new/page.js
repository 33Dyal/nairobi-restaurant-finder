import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/lib/auth/guards";
import NewRestaurantForm from "@/components/owner/NewRestaurantForm";

export const metadata = { title: "Add a restaurant" };
export const dynamic = "force-dynamic";

export default async function NewRestaurantPage() {
  const user = await requirePageRole(["OWNER", "ADMIN"], "/owner/restaurants/new");

  const areas = await prisma.area.findMany({
    where: { isActive: true, city: { isActive: true } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Add a restaurant</h1>
        <p className="text-sm text-ink-soft">
          Start with the basics. You can add photos, hours and a menu after this. An admin reviews every new listing before it appears on the site.
        </p>
      </header>

      {!user.emailVerifiedAt && (
        <p role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Please verify your email address before submitting a restaurant. Check your inbox for the verification link.
        </p>
      )}

      <NewRestaurantForm areas={areas} />
    </div>
  );
}