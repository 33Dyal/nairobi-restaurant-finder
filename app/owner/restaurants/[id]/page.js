import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/lib/auth/guards";
import { getRestaurantForEditor, getEditorAreas } from "@/lib/data/editor";
import EditorView from "@/components/restaurant-editor/EditorView";

export const metadata = { title: "Edit restaurant" };
export const dynamic = "force-dynamic";

export default async function OwnerRestaurantPage({ params }) {
  const { id } = await params;
  const user = await requirePageRole(["OWNER", "ADMIN"], `/owner/restaurants/${id}`);

  // Owners may only open restaurants they are staff of. A 404 hides whether the id exists.
  if (user.role === "OWNER") {
    const staff = await prisma.restaurantStaff.findUnique({
      where: { restaurantId_userId: { restaurantId: id, userId: user.id } },
      select: { role: true },
    });
    if (!staff) notFound();
  }

  const [restaurant, areas] = await Promise.all([getRestaurantForEditor(id), getEditorAreas()]);
  if (!restaurant) notFound();

  return <EditorView restaurant={restaurant} areas={areas} backHref="/owner" backLabel="My restaurants" />;
}
