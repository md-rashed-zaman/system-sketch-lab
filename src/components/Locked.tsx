import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import type { Level } from "@/content/types";
import { LinkButton, ProBadge } from "./ui";

export function Locked({ level, reason, signedIn, backHref, backLabel }: { level: Level; reason: "pro" | "stage"; signedIn: boolean; backHref: string; backLabel: string }) {
  return (
    <div className="paper-grid flex-1 px-4 py-12" data-testid="locked">
      <div className="mx-auto max-w-2xl">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={14} /> {backLabel}
        </Link>
        <div className="mt-4 rounded-xl border border-line bg-card p-8 ink-shadow">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper">
              <Lock size={20} />
            </span>
            {reason === "pro" && <ProBadge />}
          </div>
          <h1 className="mt-4 text-3xl">{level.title}</h1>
          <p className="mt-2 text-ink-soft">{level.tagline}</p>
          <p className="mt-5 leading-relaxed">{level.concept.intro}</p>
          <div className="mt-6 rounded-md border border-line bg-paper-2 p-4 text-sm">
            {reason === "pro" ? (
              <p>
                This level is part of <b>System Sketch Lab Pro</b>: chapters 4-6, every premium case study and every future one. The free path (chapters 1-3, the Uber case study and
                the daily challenge) stays free forever.
              </p>
            ) : signedIn ? (
              <p>Finish the previous stage first: your design from it becomes the starting point here.</p>
            ) : (
              <p>Case-study stages build on each other. Sign in and finish the previous stage to continue.</p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {reason === "pro" ? (
              <LinkButton href="/pricing" variant="accent">
                Unlock with Pro
              </LinkButton>
            ) : !signedIn ? (
              <LinkButton href="/login" variant="primary">
                Sign in
              </LinkButton>
            ) : null}
            <LinkButton href={backHref} variant="outline">
              {backLabel}
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
