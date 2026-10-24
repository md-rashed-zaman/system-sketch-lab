import { CASE_STUDIES, CHAPTERS } from "@/content";
import type { Level } from "@/content/types";
import { todayUtc } from "@/content/daily";
import { evaluate, type Evaluation } from "@/engine/scoring";
import { simulate, validateDesign } from "@/engine/simulate";
import type { Design, Issue } from "@/engine/types";
import { db, nowIso } from "./db";
import { earnedBadges, nextStreak, rankFor, xpGain } from "./gamification";
import { resolveLevel } from "./levels";

export type Plan = "free" | "monthly" | "yearly" | "lifetime";

export interface Profile {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActive: string | null;
  plan: Plan;
}

export function getProfile(userId: string): Profile {
  const row = db()
    .prepare("select xp, streak, best_streak, last_active, plan from profile where user_id = ?")
    .get(userId) as { xp: number; streak: number; best_streak: number; last_active: string | null; plan: Plan } | undefined;
  if (!row) return { xp: 0, streak: 0, bestStreak: 0, lastActive: null, plan: "free" };
  // A streak only counts if it was extended today or yesterday.
  const today = todayUtc();
  const alive = row.last_active && nextStreak(row.last_active, today, row.streak) > 1;
  return { xp: row.xp, streak: alive || row.last_active === today ? row.streak : 0, bestStreak: row.best_streak, lastActive: row.last_active, plan: row.plan };
}

export const isPro = (p: Profile) => p.plan !== "free";

export function setPlan(userId: string, plan: Plan, source: string) {
  db()
    .prepare(
      `insert into profile (user_id, plan, plan_source, plan_updated_at) values (?, ?, ?, ?)
       on conflict(user_id) do update set plan = excluded.plan, plan_source = excluded.plan_source, plan_updated_at = excluded.plan_updated_at`,
    )
    .run(userId, plan, source, nowIso());
}

export interface LevelProgress {
  stars: number;
  credits: number;
  p95: number;
  attempts: number;
}

export function getProgressMap(userId: string): Map<string, LevelProgress> {
  const rows = db()
    .prepare("select level_id, best_stars, best_credits, best_p95, attempts from progress where user_id = ?")
    .all(userId) as { level_id: string; best_stars: number; best_credits: number; best_p95: number; attempts: number }[];
  return new Map(rows.map((r) => [r.level_id, { stars: r.best_stars, credits: r.best_credits, p95: r.best_p95, attempts: r.attempts }]));
}

/** The user's best passing design for a level, used to carry case-study stages forward. */
export function getBestDesign(userId: string, levelId: string): Design | undefined {
  const row = db().prepare("select design, best_stars from progress where user_id = ? and level_id = ?").get(userId, levelId) as
    | { design: string; best_stars: number }
    | undefined;
  return row && row.best_stars > 0 ? (JSON.parse(row.design) as Design) : undefined;
}

export function getBadges(userId: string): { badge: string; earnedAt: string }[] {
  return db().prepare("select badge, earned_at as earnedAt from badges where user_id = ? order by earned_at").all(userId) as {
    badge: string;
    earnedAt: string;
  }[];
}

export class RunError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: string[],
  ) {
    super(message);
  }
}

export interface RunOutcome {
  evaluation: Evaluation;
  metrics: { availability: number; p95: number; credits: number; maxLagSec: number; failureAvailability: number };
  issues: Issue[];
  xpGained: number;
  totalXp: number;
  rank: string;
  streak: number;
  newBadges: string[];
  personalBest: boolean;
}

/** Validates, re-simulates on the server (never trusting client scores), and records progress. */
export function submitRun(userId: string, levelId: string, designInput: unknown): RunOutcome {
  const level = resolveLevel(levelId);
  if (!level) throw new RunError("Unknown level.", 404);
  const profile = getProfile(userId);
  if (level.pro && !isPro(profile)) throw new RunError("This level needs System Sketch Lab Pro.", 403);
  if (level.caseStudy && level.caseStudy.stage > 1) {
    const prev = `${level.caseStudy.slug}-${level.caseStudy.stage - 1}`;
    if (!getProgressMap(userId).get(prev)?.stars) throw new RunError("Finish the previous stage first.", 403);
  }
  const design = designInput as Design;
  const errors = validateDesign(design, { palette: level.palette, budget: level.budget });
  if (errors.length) throw new RunError("Invalid design.", 400, errors);

  const sim = simulate(design, level.scenario);
  const evaluation = evaluate(level.objectives, level.stretch, sim);
  const today = todayUtc();
  const now = nowIso();
  const conn = db();

  return conn.transaction(() => {
    conn.prepare("insert or ignore into profile (user_id) values (?)").run(userId);
    conn
      .prepare("insert into runs (user_id, level_id, stars, credits, p95, availability, created_at) values (?, ?, ?, ?, ?, ?, ?)")
      .run(userId, level.id, evaluation.stars, sim.credits, sim.p95, sim.availability, now);

    const prev = conn.prepare("select best_stars, best_credits, best_p95 from progress where user_id = ? and level_id = ?").get(userId, level.id) as
      | { best_stars: number; best_credits: number; best_p95: number }
      | undefined;
    const better =
      !prev ||
      evaluation.stars > prev.best_stars ||
      (evaluation.stars === prev.best_stars && evaluation.stars > 0 && (sim.credits < prev.best_credits || (sim.credits === prev.best_credits && sim.p95 < prev.best_p95)));
    if (!prev) {
      conn
        .prepare(
          `insert into progress (user_id, level_id, best_stars, best_credits, best_p95, best_availability, design, attempts, completed_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .run(userId, level.id, evaluation.stars, sim.credits, sim.p95, sim.availability, JSON.stringify(design), evaluation.passed ? now : null, now);
    } else if (better) {
      conn
        .prepare(
          `update progress set best_stars = ?, best_credits = ?, best_p95 = ?, best_availability = ?, design = ?, attempts = attempts + 1,
           completed_at = coalesce(completed_at, ?), updated_at = ? where user_id = ? and level_id = ?`,
        )
        .run(evaluation.stars, sim.credits, sim.p95, sim.availability, JSON.stringify(design), evaluation.passed ? now : null, now, userId, level.id);
    } else {
      conn.prepare("update progress set attempts = attempts + 1, updated_at = ? where user_id = ? and level_id = ?").run(now, userId, level.id);
    }

    const gained = xpGain(prev?.best_stars ?? 0, evaluation.stars, level.xpPerStar);
    const row = conn.prepare("select xp, streak, best_streak, last_active from profile where user_id = ?").get(userId) as {
      xp: number;
      streak: number;
      best_streak: number;
      last_active: string | null;
    };
    let { streak, last_active: lastActive } = row;
    if (evaluation.passed) {
      streak = nextStreak(row.last_active, today, row.streak);
      lastActive = today;
    }
    conn
      .prepare("update profile set xp = xp + ?, streak = ?, best_streak = max(best_streak, ?), last_active = ? where user_id = ?")
      .run(gained, streak, streak, lastActive, userId);

    if (level.kind === "daily" && evaluation.passed) recordDaily(userId, level, evaluation.stars, sim.credits, sim.p95, now);

    const newBadges = awardBadges(userId, {
      levelId: level.id,
      stars: evaluation.stars,
      hadFailures: (level.scenario.failures ?? []).length > 0,
      failureAvailability: sim.failureAvailability,
      metCreditGoal: level.stretch.some((g, i) => g.kind === "credits" && evaluation.starChecks[i]?.met),
    });

    const totalXp = row.xp + gained;
    return {
      evaluation,
      metrics: { availability: sim.availability, p95: sim.p95, credits: sim.credits, maxLagSec: sim.maxLagSec, failureAvailability: sim.failureAvailability },
      issues: sim.issues,
      xpGained: gained,
      totalXp,
      rank: rankFor(totalXp).rank.title,
      streak,
      newBadges,
      personalBest: better && evaluation.passed,
    };
  })();
}

function recordDaily(userId: string, level: Level, stars: number, credits: number, p95: number, now: string) {
  const date = level.id.slice("daily-".length);
  const conn = db();
  const prev = conn.prepare("select stars, credits, p95 from daily_scores where date = ? and user_id = ?").get(date, userId) as
    | { stars: number; credits: number; p95: number }
    | undefined;
  const better = !prev || stars > prev.stars || (stars === prev.stars && (credits < prev.credits || (credits === prev.credits && p95 < prev.p95)));
  if (better)
    conn
      .prepare(
        `insert into daily_scores (date, user_id, stars, credits, p95, created_at) values (?, ?, ?, ?, ?, ?)
         on conflict(date, user_id) do update set stars = excluded.stars, credits = excluded.credits, p95 = excluded.p95, created_at = excluded.created_at`,
      )
      .run(date, userId, stars, credits, p95, now);
}

function awardBadges(userId: string, lastRun: NonNullable<Parameters<typeof earnedBadges>[0]["lastRun"]>): string[] {
  const conn = db();
  const progress = getProgressMap(userId);
  const passed = new Set([...progress].filter(([, p]) => p.stars > 0).map(([id]) => id));
  const three = new Set([...progress].filter(([, p]) => p.stars === 3).map(([id]) => id));
  const profile = conn.prepare("select streak from profile where user_id = ?").get(userId) as { streak: number };
  const dailyPlays = (conn.prepare("select count(*) as n from daily_scores where user_id = ?").get(userId) as { n: number }).n;
  const earned = earnedBadges({
    passedLevels: passed,
    threeStarLevels: three,
    chapters: CHAPTERS.map((c) => ({ id: c.id, title: c.title, levelIds: c.levels.map((l) => l.id) })),
    uberStageIds: CASE_STUDIES.find((c) => c.slug === "uber")!.stages.map((s) => s.id),
    streak: profile.streak,
    dailyPlays,
    lastRun,
  });
  const have = new Set(getBadges(userId).map((b) => b.badge));
  const fresh = earned.filter((b) => !have.has(b));
  const insert = conn.prepare("insert or ignore into badges (user_id, badge, earned_at) values (?, ?, ?)");
  for (const b of fresh) insert.run(userId, b, nowIso());
  return fresh;
}

export interface LeaderRow {
  name: string;
  xp: number;
  rank: string;
  userId: string;
}

export function xpLeaderboard(limit = 50): LeaderRow[] {
  const rows = db()
    .prepare(`select p.user_id as userId, u.name as name, p.xp as xp from profile p join "user" u on u.id = p.user_id where p.xp > 0 order by p.xp desc, u.createdAt asc limit ?`)
    .all(limit) as { userId: string; name: string; xp: number }[];
  return rows.map((r) => ({ ...r, rank: rankFor(r.xp).rank.title }));
}

export interface DailyRow {
  userId: string;
  name: string;
  stars: number;
  credits: number;
  p95: number;
}

export function dailyLeaderboard(date: string, limit = 50): DailyRow[] {
  return db()
    .prepare(
      `select d.user_id as userId, u.name as name, d.stars as stars, d.credits as credits, d.p95 as p95
       from daily_scores d join "user" u on u.id = d.user_id where d.date = ?
       order by d.stars desc, d.credits asc, d.p95 asc, d.created_at asc limit ?`,
    )
    .all(date, limit) as DailyRow[];
}
