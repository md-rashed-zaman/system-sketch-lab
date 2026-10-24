import { CASE_STUDIES } from "./caseStudies";
import { LESSONS } from "./levels";
import { ADVANCED_ARTICLES } from "./articles/advanced";
import { CASES_A_ARTICLES } from "./articles/cases-a";
import { CASES_B_ARTICLES } from "./articles/cases-b";
import { FOUNDATIONS_ARTICLES } from "./articles/foundations";
import type { Article, Level } from "./types";

export { CHAPTERS, LESSONS } from "./levels";
export { CASE_STUDIES } from "./caseStudies";
export { topicHref } from "./links";
export type { Article, CaseStudy, Chapter, Level } from "./types";

export const ALL_LEVELS: Level[] = [...LESSONS, ...CASE_STUDIES.flatMap((c) => c.stages)];

const byId = new Map(ALL_LEVELS.map((l) => [l.id, l]));

export function getLevel(id: string): Level | undefined {
  return byId.get(id);
}

/** The level after this one in its chapter sequence or case study, if any. */
export function nextLevel(id: string): Level | undefined {
  const level = byId.get(id);
  if (!level) return undefined;
  if (level.caseStudy) {
    const cs = CASE_STUDIES.find((c) => c.slug === level.caseStudy!.slug)!;
    return cs.stages[level.caseStudy.stage];
  }
  const i = LESSONS.findIndex((l) => l.id === id);
  return LESSONS[i + 1];
}

const ARTICLES: Record<string, Article> = { ...FOUNDATIONS_ARTICLES, ...ADVANCED_ARTICLES, ...CASES_A_ARTICLES, ...CASES_B_ARTICLES };

export function getArticle(id: string): Article | undefined {
  return ARTICLES[id];
}
