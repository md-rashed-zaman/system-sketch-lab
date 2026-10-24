"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-cobalt font-display text-sm font-bold text-white"
        aria-label={`Account menu for ${name}`}
      >
        {name.slice(0, 1).toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-card p-1 ink-shadow">
          <p className="truncate px-3 py-2 text-xs text-ink-soft">Signed in as {name}</p>
          <Link role="menuitem" href="/profile" className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-paper-2" onClick={() => setOpen(false)}>
            <User size={15} /> Profile
          </Link>
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-paper-2"
            onClick={async () => {
              await authClient.signOut();
              setOpen(false);
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
