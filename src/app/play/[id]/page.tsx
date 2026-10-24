import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CASE_STUDIES, getArticle, nextLevel, topicHref } from "@/content";
import type { Level } from "@/content/types";
import { Locked } from "@/components/Locked";
import { PlaygroundClient as Playground } from "@/components/play/PlaygroundClient";
import { resolveLevel } from "@/lib/levels";
import { getBestDesign, getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const level = resolveLevel((await params).id);
  return { title: level ? level.title : "Level not found", description: level?.tagline };
}

function back(level: Level): { href: string; label: string } {
  if (level.kind === "daily") return { href: "/daily", label: "Daily challenge" };
  if (getArticle(level.id)) return { href: topicHref(level), label: "Back to the lesson" };
  if (level.caseStudy) {
    const cs = CASE_STUDIES.find((c) => c.slug === level.caseStudy!.slug)!;
    return { href: `/case-studies/${cs.slug}`, label: cs.title };
  }
  return { href: "/learn", label: "Learning path" };
}

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const level = resolveLevel(id);
  if (!level) notFound();
  const viewer = await getViewer();
  const b = back(level);

  if (level.pro && !viewer?.pro) return <Locked level={level} reason="pro" signedIn={!!viewer} backHref={b.href} backLabel={b.label} />;

  const progress = viewer ? getProgressMap(viewer.id) : new Map();
  let initial = level.start;
  if (level.caseStudy && level.caseStudy.stage > 1) {
    const prevId = `${level.caseStudy.slug}-${level.caseStudy.stage - 1}`;
    if (!viewer || !progress.get(prevId)?.stars)
      return <Locked level={level} reason="stage" signedIn={!!viewer} backHref={b.href} backLabel={b.label} />;
    initial = getBestDesign(viewer.id, prevId) ?? level.start;
  }
  if (viewer) initial = getBestDesign(viewer.id, level.id) ?? initial;

  const next = nextLevel(level.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    <Playground
      key={level.id}
      // Never ship the reference solution to the browser.
      level={{ ...level, solution: { nodes: [], edges: [] } }}
      initialDesign={initial}
      signedIn={!!viewer}
      bestStars={progress.get(level.id)?.stars ?? 0}
      backHref={b.href}
      backLabel={b.label}
      nextHref={next ? topicHref(next) : level.kind === "daily" ? undefined : level.caseStudy ? `/case-studies/${level.caseStudy.slug}` : "/learn"}
      shareUrl={level.kind === "daily" ? `${appUrl}/daily` : undefined}
    />
  );
}
