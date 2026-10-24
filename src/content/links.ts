import type { Level } from "./types";

/** Where a level's explanation lives: lessons under /learn, case-study stages under their case study. */
export function topicHref(level: Level): string {
  return level.caseStudy ? `/case-studies/${level.caseStudy.slug}/${level.caseStudy.stage}` : `/learn/${level.id}`;
}
