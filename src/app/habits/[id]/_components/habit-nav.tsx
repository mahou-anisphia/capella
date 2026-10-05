"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";

export function HabitNav({ id }: { id: number }) {
  const pathname = usePathname();
  const base = `/habits/${id}`;
  const links = [
    { href: base, label: "Overview" },
    { href: `${base}/log`, label: "Log" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <nav className="bg-muted flex w-fit gap-1 rounded-full p-1 text-sm">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring/50 rounded-full px-3 py-1 outline-none focus-visible:ring-3",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
