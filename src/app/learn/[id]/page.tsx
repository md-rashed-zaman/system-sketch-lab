import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getLevel } from "@/content";
import { TopicPage } from "@/components/topic/TopicPage";
import { getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";

function lessonFor(id: string) {
  const level = getLevel(id);
  const article = getArticle(id);
  return level?.kind === "lesson" && article ? { level, article } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const found = lessonFor((await params).id);
  return { title: found?.level.title ?? "Lesson not found", description: found?.article.overview };
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const found = lessonFor((await params).id);
  if (!found) notFound();
  const { level, article } = found;
  const viewer = await getViewer();
  const best = viewer ? (getProgressMap(viewer.id).get(level.id)?.stars ?? 0) : 0;
  return (
    <TopicPage
      level={level}
      article={article}
      kicker={`Chapter ${level.chapter} lesson`}
      back={{ href: "/learn", label: "Learning path" }}
      bestStars={best}
      play={level.pro && !viewer?.pro ? { kind: "pro" } : { kind: "play" }}
    />
  );
}
