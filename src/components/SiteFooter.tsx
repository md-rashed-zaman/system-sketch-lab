import Link from "next/link";
import { getViewer } from "@/lib/session";
import { Logo } from "./ui";

export async function SiteFooter() {
  const viewer = await getViewer();
  return (
    <footer className="border-t border-line bg-paper-2" data-site-footer>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-soft">Interactive system design for engineers everywhere. Read it, build it, break it.</p>
        </div>
        <FooterCol title="Learn" links={[["/learn", "Learning path"], ["/case-studies", "Case studies"], ["/daily", "Daily challenge"], ["/sandbox", "Sandbox"]]} />
        <FooterCol title="Community" links={[["/leaderboard", "Leaderboard"], ["/profile", "Your profile"]]} />
        <FooterCol title="Product" links={viewer ? [["/pricing", "Pricing"]] : [["/pricing", "Pricing"], ["/signup", "Create account"]]} />
      </div>
      <p className="border-t border-line py-4 text-center font-mono text-xs text-ink-soft">
        Simulations are simplified teaching models, not benchmarks. © {new Date().getFullYear()} System Sketch Lab
      </p>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-cobalt">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
