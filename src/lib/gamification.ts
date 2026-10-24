export interface Rank {
  title: string;
  min: number;
}

export const RANKS: Rank[] = [
  { title: "Intern", min: 0 },
  { title: "Junior Engineer", min: 300 },
  { title: "Engineer", min: 900 },
  { title: "Senior Engineer", min: 2000 },
  { title: "Staff Engineer", min: 4000 },
  { title: "Principal Engineer", min: 7000 },
  { title: "Distinguished Engineer", min: 12000 },
];

export function rankFor(xp: number): { rank: Rank; next?: Rank; progress: number } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].min) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1];
  const progress = next ? (xp - rank.min) / (next.min - rank.min) : 1;
  return { rank, next, progress };
}

/** XP is earned once per newly gained star, so replays only pay when you improve. */
export function xpGain(previousStars: number, newStars: number, xpPerStar: number): number {
  return Math.max(0, newStars - previousStars) * xpPerStar;
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Streak of consecutive UTC days with a passed run. */
export function nextStreak(lastActive: string | null, today: string, streak: number): number {
  if (!lastActive) return 1;
  const diff = dayDiff(lastActive, today);
  if (diff <= 0) return Math.max(streak, 1);
  if (diff === 1) return streak + 1;
  return 1;
}

export interface BadgeContext {
  passedLevels: Set<string>;
  threeStarLevels: Set<string>;
  chapters: { id: number; title: string; levelIds: string[] }[];
  uberStageIds: string[];
  streak: number;
  dailyPlays: number;
  lastRun?: { levelId: string; stars: number; hadFailures: boolean; failureAvailability: number; metCreditGoal: boolean };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface BadgeRule extends Badge {
  earned: (c: BadgeContext) => boolean;
}

const chapterBadge = (id: number, title: string): BadgeRule => ({
  id: `chapter-${id}`,
  title: `${title} cleared`,
  description: `Passed every level in chapter ${id}.`,
  icon: "book-check",
  earned: (c) => {
    const ch = c.chapters.find((x) => x.id === id);
    return !!ch && ch.levelIds.every((l) => c.passedLevels.has(l));
  },
});

export const BADGE_RULES: BadgeRule[] = [
  { id: "first-deploy", title: "First Deploy", description: "Passed your first level.", icon: "rocket", earned: (c) => c.passedLevels.size >= 1 },
  { id: "three-stars", title: "Triple Star", description: "Earned three stars on a level.", icon: "star", earned: (c) => c.threeStarLevels.size >= 1 },
  {
    id: "zero-downtime",
    title: "Zero Downtime",
    description: "Kept 100% of requests flowing while something was broken.",
    icon: "shield-check",
    earned: (c) => !!c.lastRun && c.lastRun.stars > 0 && c.lastRun.hadFailures && c.lastRun.failureAvailability >= 0.9999,
  },
  {
    id: "frugal",
    title: "Frugal Architect",
    description: "Hit a level's credit stretch goal.",
    icon: "piggy-bank",
    earned: (c) => !!c.lastRun && c.lastRun.stars > 0 && c.lastRun.metCreditGoal,
  },
  chapterBadge(1, "Foundations"),
  chapterBadge(2, "Caching"),
  chapterBadge(3, "Databases"),
  chapterBadge(4, "Async processing"),
  chapterBadge(5, "Protecting the system"),
  chapterBadge(6, "Real-time and location"),
  {
    id: "uber-architect",
    title: "Uber Architect",
    description: "Completed the How Uber works case study.",
    icon: "car",
    earned: (c) => c.uberStageIds.length > 0 && c.uberStageIds.every((l) => c.passedLevels.has(l)),
  },
  { id: "daily-player", title: "Daily Driver", description: "Played a daily challenge.", icon: "calendar-check", earned: (c) => c.dailyPlays >= 1 },
  { id: "streak-7", title: "On Call", description: "A 7-day streak.", icon: "flame", earned: (c) => c.streak >= 7 },
  { id: "boss", title: "Black Friday Survivor", description: "Beat the boss level.", icon: "trophy", earned: (c) => c.passedLevels.has("black-friday") },
];

export const BADGES: Badge[] = BADGE_RULES.map(({ id, title, description, icon }) => ({ id, title, description, icon }));

export function earnedBadges(c: BadgeContext): string[] {
  return BADGE_RULES.filter((b) => b.earned(c)).map((b) => b.id);
}
