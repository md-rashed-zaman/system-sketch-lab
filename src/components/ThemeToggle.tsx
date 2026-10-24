"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("sf:theme", next);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark theme"
      title="Toggle dark theme"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
    >
      <Moon size={18} className="dark:hidden" />
      <Sun size={18} className="hidden dark:block" />
    </button>
  );
}
