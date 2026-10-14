"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Map, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Explore", href: "/explore", Icon: Compass },
  { label: "Map", href: "/map", Icon: Map },
  { label: "Favorites", href: "/favorites", Icon: Heart },
  { label: "Account", href: "/account", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ label, href, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-lantern" : "text-ink-faint"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
