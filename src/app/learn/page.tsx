import { ArrowRight, Clock, Lock, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CHAPTERS, LESSONS, getArticle, topicHref } from "@/content";
import { CHAPTER_ICONS } from "@/components/topicIcons";
import { IconTile, LinkButton, Pill, ProBadge, Stars } from "@/components/ui";
import { getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Learning path", description: "Six chapters of system design lessons, from one server to planet scale." };

export default async function LearnPage() {
  const viewer = await getViewer();
  const progress = viewer ? getProgressMap(viewer.id) : new Map();
  const cleared = LESSONS.filter((l) => progress.get(l.id)?.stars).length;
  const stars = LESSONS.reduce((s, l) => s + (progress.get(l.id)?.stars ?? 0), 0);
  const next = LESSONS.find((l) => !progress.get(l.id)?.stars && (!l.pro || viewer?.pro)) ?? LESSONS[0];

  return (
    <div className="flex-1">
      <div className="paper-grid border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-12 sm:px-6">
          <div>
            <p className="eyebrow">Learning path</p>
            <h1 className="mt-2 text-4xl sm:text-5xl">From one server to <em className="whitespace-nowrap">planet scale.</em></h1>
            <p className="mt-3 max-w-xl text-lg text-ink-soft">Each lesson explains one idea, then lets you prove it on the canvas.</p>
          </div>
          <div className="flex items-center gap-6 rounded-2xl border border-line bg-card px-5 py-4 shadow-[var(--shadow)]" data-testid="path-progress">
            <div>
              <p className="font-mono text-2xl font-semibold tabular">
                {cleared}/{LESSONS.length}
              </p>
              <p className="text-xs text-ink-soft">lessons cleared</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular">
                {stars}/{LESSONS.length * 3}
              </p>
              <p className="text-xs text-ink-soft">stars</p>
            </div>
            <LinkButton href={topicHref(next)} variant="accent">
              {cleared ? "Continue" : "Start"} <ArrowRight size={15} />
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {!viewer && (
          <p className="mb-10 flex items-center gap-3 rounded-xl bg-cobalt-soft px-4 py-3 text-sm text-ink-2">
            <UserPlus size={17} className="shrink-0 text-cobalt" />
            <span>
              Playing as a guest.{" "}
              <Link href="/signup" className="font-semibold text-cobalt hover:underline">
                Create a free account
              </Link>{" "}
              to save stars, earn XP and keep a streak.
            </span>
          </p>
        )}

        <div className="space-y-14">
          {CHAPTERS.map((c) => {
            const locked = c.pro && !viewer?.pro;
            return (
              <section key={c.id} aria-labelledby={`ch-${c.id}`}>
                <div className="flex items-center gap-4">
                  <IconTile icon={CHAPTER_ICONS[c.id]} tone={c.pro ? "ink" : "cobalt"} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-ink-soft">Chapter {c.id}</span>
                      {c.pro ? <ProBadge /> : <Pill tone="ok">Free</Pill>}
                    </div>
                    <h2 id={`ch-${c.id}`} className="text-2xl font-semibold tracking-tight">
                      {c.title}
                    </h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {c.levels.map((l, i) => {
                    const p = progress.get(l.id);
                    return (
                      <Link
                        key={l.id}
                        href={topicHref(l)}
                        className="group flex flex-col rounded-2xl border border-line bg-card p-5 transition hover:shadow-[var(--shadow)]"
                        data-testid={`level-card-${l.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-ink-soft">
                            {c.id}.{i + 1}
                          </span>
                          {locked ? <Lock size={15} className="text-ink-soft" /> : <Stars count={p?.stars ?? 0} size={15} />}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold group-hover:text-cobalt">{l.title}</h3>
                        <p className="mt-1 flex-1 text-sm text-ink-soft">{l.tagline}</p>
                        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-soft">
                          <Clock size={13} /> {getArticle(l.id)?.minutes ?? 5} min read
                          {p && (
                            <span className="ml-auto font-mono">
                              best {p.credits} cr · p95 {Math.round(p.p95)} ms
                            </span>
                          )}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
