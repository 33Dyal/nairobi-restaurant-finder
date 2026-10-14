import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import BecomeOwnerButton from "@/components/owner/BecomeOwnerButton";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "List your restaurant",
  description: "Add your restaurant to Nairobi Eats for free. Create an account, submit your details and reach diners across Nairobi.",
  path: "/list-your-restaurant",
});
export const dynamic = "force-dynamic";

const STEPS = [
  "Create an account and verify your email.",
  "Add your restaurant's details.",
  "We review it, then it goes live on Nairobi Eats.",
  "Keep your listing up to date from your owner dashboard.",
];

const PRIMARY = "inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black";
const SECONDARY = "inline-block rounded-lg border border-line px-5 py-3 text-sm font-semibold hover:bg-surface";

function Action({ user }) {
  if (!user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link href="/register" className={PRIMARY}>Create an account</Link>
        <Link href="/login?next=%2Flist-your-restaurant" className={SECONDARY}>Sign in</Link>
      </div>
    );
  }
  if (!user.emailVerifiedAt) {
    return (
      <p role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        Please verify your email address first. We sent a link when you signed up. Then come back to this page.
      </p>
    );
  }
  if (user.role === "OWNER" || user.role === "ADMIN") {
    return (
      <div className="flex flex-wrap gap-3">
        <Link href="/owner/restaurants/new" className={PRIMARY}>Add a restaurant</Link>
        <Link href="/owner" className={SECONDARY}>Go to my dashboard</Link>
      </div>
    );
  }
  return <BecomeOwnerButton />;
}

export default async function ListYourRestaurantPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">List your restaurant</h1>
        <p className="text-ink-soft">
          Put your restaurant in front of diners across Nairobi. It&apos;s free, and you stay in control of your listing.
        </p>
      </header>

      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">{i + 1}</span>
            <span className="pt-0.5 text-sm">{step}</span>
          </li>
        ))}
      </ol>

      <Action user={user} />
    </div>
  );
}
