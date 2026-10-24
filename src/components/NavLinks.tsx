"use client";

import clsx from "clsx";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/daily", label: "Daily" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/pricing", label: "Pricing" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors lg:px-3",
              active ? "bg-paper-3 text-ink" : "text-ink-soft hover:bg-paper-2 hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ guest }: { guest?: boolean }) {
  const path = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  // Closing on navigation: the menu is open only for the path it was opened on.
  const open = openPath === path;
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpenPath(open ? null : path)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <nav aria-label="Mobile" className="absolute inset-x-0 top-16 border-b border-line bg-paper px-4 py-3 shadow-lg">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-paper-2" aria-current={path.startsWith(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          {guest && (
            <Link href="/login" className="mt-1 block rounded-lg border-t border-line px-3 py-2.5 font-medium hover:bg-paper-2 sm:hidden">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
