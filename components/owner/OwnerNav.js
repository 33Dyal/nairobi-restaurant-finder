"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Add a link here when a new owner section is built.
const ITEMS = [
  { href: "/owner", label: "My restaurants", exact: true },
  { href: "/owner/restaurants/new", label: "Add a restaurant" },
];

export default function OwnerNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Owner sections" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
              active ? "bg-white text-black" : "text-ink-soft hover:bg-surface"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}