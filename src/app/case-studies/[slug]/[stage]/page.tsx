import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CASE_STUDIES, getArticle } from "@/content";
import { TopicPage, type PlayState } from "@/components/topic/TopicPage";
import { getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";

function stageFor(slug: string, stage: string) {
  const cs = CASE_STUDIES.find((c) => c.slug === slug && !c.comingSoon);
  const level = cs?.stages.find((s) => String(s.caseStudy!.stage) === stage);
  const article = level && getArticle(level.id);
  return cs && level && article ? { cs, level, article } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; stage: string }> }): Promise<Metadata> {
  const { slug, stage } = await params;
  const found = stageFor(slug, stage);
  return { title: found ? `${found.level.title} · ${found.cs.title}` : "Stage not found", description: found?.article.overview };
}

export default async function StagePage({ params }: { params: Promise<{ slug: string; stage: string }> }) {
  const { slug, stage } = await params;
  const found = stageFor(slug, stage);
  if (!found) notFound();
  const { cs, level, article } = found;
  const viewer = await getViewer();
  const progress = viewer ? getProgressMap(viewer.id) : new Map();
  const n = level.caseStudy!.stage;
  const prev = cs.stages[n - 2];
  const play: PlayState =
    level.pro && !viewer?.pro
      ? { kind: "pro" }
      : prev && !progress.get(prev.id)?.stars
        ? { kind: "stage", prevHref: `/case-studies/${cs.slug}/${n - 1}`, prevTitle: `stage ${n - 1}` }
        : { kind: "play" };
  return (
    <TopicPage
      level={level}
      article={article}
      kicker={`${cs.title} · stage ${n} of ${cs.stages.length}`}
      back={{ href: `/case-studies/${cs.slug}`, label: cs.title }}
      bestStars={progress.get(level.id)?.stars ?? 0}
      play={play}
    />
  );
}
