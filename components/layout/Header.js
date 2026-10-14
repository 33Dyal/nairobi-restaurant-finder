import Link from "next/link";
import { User } from "lucide-react";
import { siteConfig } from "@/config/site";
import NavLinks from "./NavLinks";
import UserMenu from "@/components/auth/UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-jacaranda-700"
          aria-label={`${siteConfig.name} home`}
        >
          {siteConfig.name}
        </Link>
        <NavLinks />
        <UserMenu />
        <Link
          href="/account"
          className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft hover:bg-paper md:hidden"
          aria-label="Account"
        >
          <User className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
