import { Flame } from "lucide-react";
import Link from "next/link";
import { rankFor } from "@/lib/gamification";
import { getViewer } from "@/lib/session";
import { MobileNav, NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";
import { LinkButton, Logo, ProBadge } from "./ui";
import { UserMenu } from "./UserMenu";

export async function SiteHeader() {
  const viewer = await getViewer();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link href="/" aria-label="System Sketch Lab home">
          <Logo />
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {viewer ? (
            <>
              <Link
                href="/profile"
                className="hidden items-center gap-3 whitespace-nowrap rounded-md border border-line bg-paper-2 px-3 py-1.5 text-xs sm:flex hover:border-ink/30"
                data-testid="xp-chip"
              >
                <span className="font-mono font-semibold tabular">{viewer.profile.xp} XP</span>
                <span className="hidden text-ink-soft xl:inline">{rankFor(viewer.profile.xp).rank.title}</span>
                <span className="inline-flex items-center gap-1 font-mono text-signal" title="Day streak">
                  <Flame size={14} /> {viewer.profile.streak}
                </span>
              </Link>
              {viewer.pro && <ProBadge />}
              <UserMenu name={viewer.name} />
              <MobileNav />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden whitespace-nowrap text-sm font-semibold hover:text-cobalt sm:inline">
                Sign in
              </Link>
              <LinkButton href="/signup" variant="accent" className="px-3 py-2 sm:px-4">
                Start free
              </LinkButton>
              <MobileNav guest />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
