import { ArrowLeft, ArrowRight, BookOpen, Building2, Check, CircleCheck, Layers, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CASE_STUDIES, topicHref } from "@/content";
import { CASE_ICONS } from "@/components/topicIcons";
import { IconTile, LinkButton, Pill, ProBadge, Stars } from "@/components/ui";
import { getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cs = CASE_STUDIES.find((c) => c.slug === slug);
  return { title: cs?.title ?? "Case study", description: cs?.blurb };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cs = CASE_STUDIES.find((c) => c.slug === slug && !c.comingSoon);
  if (!cs) notFound();
  const viewer = await getViewer();
  const progress = viewer ? getProgressMap(viewer.id) : new Map();
  const locked = cs.pro && !viewer?.pro;
  const nextStage = cs.stages.find((s) => !progress.get(s.id)?.stars) ?? cs.stages[0];

  const Icon = CASE_ICONS[cs.slug] ?? Building2;

  return (
    <div className="flex-1">
      <div className="paper-grid border-b border-line">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6">
          <Link href="/case-studies" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            <ArrowLeft size={15} /> All case studies
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <IconTile icon={Icon} tone={cs.pro ? "ink" : "signal"} />
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              {cs.pro ? <ProBadge /> : <Pill tone="ok">Free</Pill>}
              <span className="inline-flex items-center gap-1.5">
                <Layers size={14} /> {cs.stages.length} stages
              </span>
            </div>
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl">{cs.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{cs.blurb}</p>
          <div className="mt-6">
            {locked ? (
              <LinkButton href="/pricing" variant="accent">
                <Lock size={15} /> Unlock with Pro
              </LinkButton>
            ) : (
              <LinkButton href={topicHref(nextStage)} variant="accent">
                {progress.get(cs.stages[0].id)?.stars ? "Continue" : "Start stage 1"} <ArrowRight size={15} />
              </LinkButton>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h2 className="text-sm font-semibold text-ink-soft">What you will learn</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {cs.learn.map((x) => (
            <li key={x} className="flex items-center gap-2.5">
              <CircleCheck size={17} className="shrink-0 text-ok" /> {x}
            </li>
          ))}
        </ul>

        <ol className="mt-12 space-y-4">
          {cs.stages.map((s, i) => {
            const p = progress.get(s.id);
            const prevDone = i === 0 || !!progress.get(cs.stages[i - 1].id)?.stars;
            const playable = !locked && prevDone;
            return (
              <li key={s.id} data-testid={`stage-${s.id}`} className="flex gap-4 rounded-2xl border border-line bg-card p-5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold ${p?.stars ? "bg-ok/10 text-ok" : "bg-paper-3"}`}
                >
                  {p?.stars ? <Check size={17} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={topicHref(s)} className="text-lg font-semibold hover:text-cobalt">
                        {s.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-ink-soft">{s.tagline}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {playable && p?.stars ? <Stars count={p.stars} /> : null}
                      <LinkButton href={topicHref(s)} variant={playable && !p?.stars ? "primary" : "outline"} className="py-2">
                        <BookOpen size={15} /> {locked ? "Preview" : "Read"}
                      </LinkButton>
                      {playable && p?.stars ? (
                        <LinkButton href={`/play/${s.id}`} variant="ghost" className="py-2">
                          Replay
                        </LinkButton>
                      ) : null}
                      {locked && <Lock size={15} className="text-ink-soft" aria-label="Pro" />}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
