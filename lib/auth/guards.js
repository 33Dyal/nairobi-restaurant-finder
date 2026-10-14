import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./current-user";

const currentUser = cache(getCurrentUser);

// For Server Component pages. Layouts don't re-run on client navigation, so
// call these inside each page rather than in a layout.
export async function requirePageUser(path) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return user;
}

export async function requirePageRole(roles, path) {
  const user = await requirePageUser(path);
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}
