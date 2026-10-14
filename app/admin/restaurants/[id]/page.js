import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth/guards";
import { getRestaurantForEditor, getEditorAreas } from "@/lib/data/editor";
import EditorView from "@/components/restaurant-editor/EditorView";

export const metadata = { title: "Edit restaurant · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminRestaurantPage({ params }) {
  const { id } = await params;
  await requirePageRole(["ADMIN"], `/admin/restaurants/${id}`);

  const [restaurant, areas] = await Promise.all([getRestaurantForEditor(id), getEditorAreas()]);
  if (!restaurant) notFound();

  return <EditorView restaurant={restaurant} areas={areas} backHref="/admin/restaurants" backLabel="All restaurants" />;
}
