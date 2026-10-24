import type { Metadata } from "next";
import Link from "next/link";
import { CASE_STUDIES } from "@/content";
import { Building2, Clock } from "lucide-react";
import { CASE_ICONS } from "@/components/topicIcons";
import { IconTile, Pill, ProBadge } from "@/components/ui";
import { getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Case studies", description: "Playable, multi-stage case studies: how Uber, WhatsApp, Netflix and X/Twitter work." };

export default async function CaseStudiesPage() {
  const viewer = await getViewer();
  const progress = viewer ? getProgressMap(viewer.id) : new Map();
  return (
    <div className="flex-1">
      <div className="paper-grid border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="eyebrow">Case studies</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Build the systems you <em className="whitespace-nowrap">use every day.</em></h1>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">Learn how each product works, stage by stage, then build it yourself.</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {CASE_STUDIES.map((c) => {
            const done = c.stages.filter((s) => progress.get(s.id)?.stars).length;
            const card = (
              <>
                <div className="flex items-center justify-between">
                  <IconTile icon={CASE_ICONS[c.slug] ?? Building2} tone={c.comingSoon || c.pro ? "ink" : "signal"} />
                  {c.comingSoon ? (
                    <Pill tone="muted">
                      <Clock size={12} /> Coming soon
                    </Pill>
                  ) : c.pro ? (
                    <ProBadge />
                  ) : (
                    <Pill tone="ok">Free</Pill>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight">{c.title}</h2>
                <p className="mt-1.5 text-ink-soft">{c.blurb}</p>
                {!c.comingSoon && (
                  <>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-3">
                        <div className="h-full bg-ok" style={{ width: `${(done / c.stages.length) * 100}%` }} />
                      </div>
                      <span className="text-xs text-ink-soft tabular">
                        {done}/{c.stages.length} stages
                      </span>
                    </div>
                  </>
                )}
              </>
            );
            return c.comingSoon ? (
              <div key={c.slug} className="rounded-2xl border border-dashed border-line p-6 opacity-60">
                {card}
              </div>
            ) : (
              <Link key={c.slug} href={`/case-studies/${c.slug}`} className="rounded-2xl border border-line bg-card p-6 transition hover:shadow-[var(--shadow)]" data-testid={`case-${c.slug}`}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
