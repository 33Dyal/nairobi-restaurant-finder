"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { toast } from "@/stores/toast";

export default function UserMenu() {
  const { data: user, isPending } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus(); // put keyboard focus back on the button
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (isPending) return <div className="hidden h-10 w-28 md:block" aria-hidden="true" />;

  if (!user) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink">Sign in</Link>
        <Link href="/register" className="rounded-lg bg-jacaranda-600 px-4 py-2 text-sm font-semibold text-black hover:bg-jacaranda-700">Create account</Link>
      </div>
    );
  }

  const onLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () => { setOpen(false); toast.success("You've been signed out."); router.replace("/"); router.refresh(); },
      onError: () => toast.error("Couldn't sign out. Please try again."),
    });

  // This is a disclosure (a button that shows a list of links), not an ARIA "menu".
  // A real menu role would promise arrow-key navigation that this doesn't have, so
  // plain links and buttons are the more honest and more usable pattern.
  return (
    <div
      className="relative hidden md:block"
      ref={ref}
      onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget)) setOpen(false); }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="user-menu"
        className="flex min-h-10 items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm font-medium hover:bg-paper"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-jacaranda-600 text-sm font-semibold text-black" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
        <span className="max-w-28 truncate">{user.name.split(" ")[0]}</span>
        <span className="sr-only">account menu</span>
        <ChevronDown className="h-4 w-4 text-ink-faint" aria-hidden="true" />
      </button>
      {open && (
        <div id="user-menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          <p className="truncate px-3 py-2 text-xs text-ink-soft">{user.email}</p>
          <MenuLink href="/account" onClick={() => setOpen(false)}>My account</MenuLink>
          <MenuLink href="/favorites" onClick={() => setOpen(false)}>Favorites</MenuLink>
          {(user.role === "OWNER" || user.role === "ADMIN") && <MenuLink href="/owner" onClick={() => setOpen(false)}>Owner dashboard</MenuLink>}
          {user.role === "ADMIN" && <MenuLink href="/admin" onClick={() => setOpen(false)}>Admin dashboard</MenuLink>}
          <button type="button" onClick={onLogout} disabled={logout.isPending} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-paper">Sign out</button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, children, onClick }) {
  return <Link href={href} onClick={onClick} className="block rounded-lg px-3 py-2 text-sm hover:bg-paper">{children}</Link>;
}
