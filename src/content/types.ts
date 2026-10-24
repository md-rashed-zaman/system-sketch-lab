import type { Goal, Objectives } from "@/engine/scoring";
import type { ComponentType, Design, Scenario } from "@/engine/types";

export interface Concept {
  intro: string;
  points: string[];
  tradeoffs: string[];
  interviewTip: string;
}

export interface Level {
  id: string;
  kind: "lesson" | "case" | "daily";
  title: string;
  tagline: string;
  concept: Concept;
  brief: string;
  palette: ComponentType[];
  start: Design;
  scenario: Scenario;
  budget: number;
  objectives: Objectives;
  /** Up to two stretch goals; each met earns an extra star once objectives pass. */
  stretch: Goal[];
  hints: string[];
  /** Hidden reference design; tests prove it earns at least one star. */
  solution: Design;
  pro: boolean;
  xpPerStar: number;
  chapter?: number;
  caseStudy?: { slug: string; stage: number };
}

export interface Chapter {
  id: number;
  title: string;
  blurb: string;
  pro: boolean;
  levels: Level[];
}

export interface CaseStudy {
  slug: string;
  title: string;
  company: string;
  blurb: string;
  pro: boolean;
  comingSoon?: boolean;
  learn: string[];
  stages: Level[];
}

/** Icons an article section may use; rendered with lucide in ArticleView. */
export type ArticleIcon =
  | "server"
  | "database"
  | "zap"
  | "shield"
  | "gauge"
  | "layers"
  | "globe"
  | "clock"
  | "split"
  | "repeat"
  | "alert"
  | "coins"
  | "lock"
  | "activity"
  | "inbox"
  | "map-pin"
  | "message"
  | "film"
  | "hard-drive"
  | "users"
  | "scale"
  | "cpu"
  | "network"
  | "trending-up";

/** The full explanation shown on a topic page before the player opens the canvas. */
export interface Article {
  /** Reading time in minutes. */
  minutes: number;
  /** Two or three sentences: what this topic is and what you will be able to do after it. */
  overview: string;
  /** The real-world problem, told as a short concrete story (one paragraph). */
  problem: string;
  /** Three or four "how it works" sections. Paragraphs are short (2-4 sentences). */
  sections: { icon: ArticleIcon; heading: string; paragraphs: string[]; bullets?: string[] }[];
  /**
   * One or two request-path diagrams, drawn left to right with component icons and animated hop by hop.
   * `steps` narrates each hop: steps[i] says what happens at nodes[i] in this topic (same length as nodes).
   */
  diagrams: { title: string; nodes: ComponentType[]; caption: string; steps?: string[] }[];
  /** Three or four rules of thumb, e.g. { value: "~1 ms", label: "a cache hit" }. */
  numbers: { value: string; label: string }[];
  /** Optional side-by-side comparison: each row is [aspect, option A, option B]. */
  compare?: { headers: [string, string]; rows: [string, string, string][] };
  /** Two real companies and how they use the idea. */
  realWorld: { company: string; text: string }[];
  /** Three common mistakes. */
  mistakes: string[];
  interview: { tip: string; questions: string[] };
  /** Two or three multiple-choice checks; `answer` is the index of the correct option. */
  quiz: { question: string; options: string[]; answer: number; explain: string }[];
}
