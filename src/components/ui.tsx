import clsx from "clsx";
import { Star, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2 shadow-sm",
  accent: "bg-signal text-white shadow-sm hover:brightness-110",
  outline: "border border-line bg-card text-ink hover:border-ink/30 hover:bg-paper-2",
  ghost: "text-ink hover:bg-paper-2",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}

export function LinkButton({ variant, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={clsx(base, variants[(variant as Variant | undefined) ?? "primary"], className)} {...props} />;
}

export function Stars({ count, size = 16, className, animate }: { count: number; size?: number; className?: string; animate?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.8}
          className={clsx(i < count ? "fill-gold text-gold" : "fill-transparent text-ink-soft/40", animate && i < count && "star-pop")}
          style={animate ? { animationDelay: `${250 + i * 220}ms` } : undefined}
        />
      ))}
    </span>
  );
}

export function Pill({ children, tone = "ink", className }: { children: ReactNode; tone?: "ink" | "signal" | "cobalt" | "ok" | "muted"; className?: string }) {
  const tones = {
    ink: "bg-ink text-paper",
    signal: "bg-signal-soft text-signal border border-signal/30",
    cobalt: "bg-cobalt-soft text-cobalt border border-cobalt/20",
    ok: "bg-ok/10 text-ok border border-ok/25",
    muted: "bg-paper-2 text-ink-soft border border-line",
  };
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function ProBadge() {
  return (
    <Pill tone="signal" className="text-[11px]">
      Pro
    </Pill>
  );
}

export function SectionTitle({ kicker, title, children }: { kicker?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      {kicker && <p className="text-sm font-medium text-signal">{kicker}</p>}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-lg text-ink-soft">{children}</p>}
    </div>
  );
}

/** A rounded square holding an icon: the house style for feature and section markers. */
export function IconTile({ icon: Icon, tone = "cobalt", size = "md" }: { icon: LucideIcon; tone?: "cobalt" | "signal" | "ok" | "gold" | "ink"; size?: "sm" | "md" }) {
  const tones = {
    cobalt: "bg-cobalt-soft text-cobalt",
    signal: "bg-signal-soft text-signal",
    ok: "bg-ok/10 text-ok",
    gold: "bg-gold/15 text-gold",
    ink: "bg-paper-3 text-ink",
  };
  return (
    <span className={clsx("inline-flex shrink-0 items-center justify-center rounded-lg", tones[tone], size === "sm" ? "h-8 w-8" : "h-10 w-10")}>
      <Icon size={size === "sm" ? 16 : 20} strokeWidth={1.9} />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      {/* A tiny hand-sketched architecture: two services feeding a hot node. */}
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
        <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-ink)" />
        <path d="M9.5 9.2 C13 9.8 15 13 17.6 17.4 M9.4 18.6 C12.5 18.2 14.6 18.1 17.4 18.4" fill="none" stroke="var(--color-paper)" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
        <rect x="5.5" y="5.8" width="6.5" height="6.5" rx="2" fill="var(--color-paper)" />
        <rect x="5.5" y="15.4" width="6.5" height="6.5" rx="2" fill="var(--color-paper)" />
        <rect x="16" y="14.8" width="7.2" height="7.2" rx="2.2" fill="var(--color-signal)" />
      </svg>
      {/* Stacked where the header is tight (phones, and 1024-1279px next to the full nav); one line elsewhere. */}
      <span className="flex flex-col whitespace-nowrap font-[family-name:var(--font-bricolage)] font-bold leading-none tracking-tight sm:flex-row sm:items-baseline sm:gap-1.5 lg:flex-col lg:items-start lg:gap-0 xl:flex-row xl:items-baseline xl:gap-1.5">
        <span className="text-[15px] sm:text-lg lg:text-[15px] xl:text-lg">System Sketch</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-signal sm:mt-0 sm:text-lg sm:normal-case sm:tracking-tight lg:mt-0.5 lg:text-[10px] lg:uppercase lg:tracking-[0.25em] xl:mt-0 xl:text-lg xl:normal-case xl:tracking-tight">
          Lab
        </span>
      </span>
    </span>
  );
}
