import { requirePageUser } from "@/lib/auth/guards";
import { ResendVerification, SignOutButton } from "@/components/auth/AccountActions";

export const metadata = { title: "Account", robots: { index: false, follow: false } };

const ROLE_LABEL = { CUSTOMER: "Customer", OWNER: "Restaurant owner", ADMIN: "Administrator" };

export default async function AccountPage() {
  const user = await requirePageUser("/account");
  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Hi, {user.name.split(" ")[0]}</h1>
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        <div className="flex justify-between gap-4 px-5 py-3.5 text-sm"><dt className="text-ink-soft">Name</dt><dd className="font-medium">{user.name}</dd></div>
        <div className="flex justify-between gap-4 px-5 py-3.5 text-sm"><dt className="text-ink-soft">Email</dt><dd className="font-medium">{user.email}</dd></div>
        <div className="flex justify-between gap-4 px-5 py-3.5 text-sm"><dt className="text-ink-soft">Account type</dt><dd className="font-medium">{ROLE_LABEL[user.role]}</dd></div>
        <div className="flex justify-between gap-4 px-5 py-3.5 text-sm"><dt className="text-ink-soft">Email status</dt><dd className="font-medium">{user.emailVerifiedAt ? "Verified" : "Not verified"}</dd></div>
      </dl>
      {!user.emailVerifiedAt && (
        <div className="mt-4 rounded-2xl border border-jacaranda-100 bg-jacaranda-50 p-5">
          <p className="text-sm text-jacaranda-700">Verify your email to write reviews and receive notifications.</p>
          <div className="mt-3"><ResendVerification email={user.email} /></div>
        </div>
      )}
      <div className="mt-6"><SignOutButton /></div>
      <p className="mt-8 text-sm text-ink-soft">Profile, preferences, reviews and notifications arrive in Phase 14.</p>
    </section>
  );
}
