import type { SimResult } from "./types";

export type GoalKind = "availability" | "p95" | "credits" | "failureAvailability" | "lag";

export interface Goal {
  kind: GoalKind;
  value: number;
}

export interface Objectives {
  minAvailability: number;
  maxP95: number;
  maxLagSec?: number;
}

export interface Check {
  label: string;
  met: boolean;
  actual: string;
  target: string;
}

export interface Evaluation {
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  checks: Check[];
  starChecks: Check[];
}

export const fmtPct = (x: number) => `${(Math.floor(x * 10_000) / 100).toFixed(2)}%`;
export const fmtMs = (x: number) => `${Math.round(x)} ms`;
export const fmtLag = (x: number) => (x >= 9_999 ? "never caught up" : `${Math.round(x)} s`);

export function goalLabel(goal: Goal): string {
  switch (goal.kind) {
    case "availability":
      return `Availability at least ${fmtPct(goal.value)}`;
    case "p95":
      return `p95 latency at most ${fmtMs(goal.value)}`;
    case "credits":
      return `Spend at most ${goal.value} credits`;
    case "failureAvailability":
      return `Stay at least ${fmtPct(goal.value)} available while something is broken`;
    case "lag":
      return `Queue lag at most ${fmtLag(goal.value)}`;
  }
}

export function checkGoal(goal: Goal, r: SimResult): Check {
  const label = goalLabel(goal);
  switch (goal.kind) {
    case "availability":
      return { label, met: r.availability >= goal.value, actual: fmtPct(r.availability), target: fmtPct(goal.value) };
    case "p95":
      return { label, met: r.p95 <= goal.value, actual: fmtMs(r.p95), target: fmtMs(goal.value) };
    case "credits":
      return { label, met: r.credits <= goal.value, actual: `${r.credits}`, target: `${goal.value}` };
    case "failureAvailability":
      return { label, met: r.failureAvailability >= goal.value, actual: fmtPct(r.failureAvailability), target: fmtPct(goal.value) };
    case "lag":
      return { label, met: r.maxLagSec <= goal.value, actual: fmtLag(r.maxLagSec), target: fmtLag(goal.value) };
  }
}

/** One star for meeting every objective; one more for each stretch goal met on top. */
export function evaluate(objectives: Objectives, stretch: Goal[], r: SimResult): Evaluation {
  const goals: Goal[] = [
    { kind: "availability", value: objectives.minAvailability },
    { kind: "p95", value: objectives.maxP95 },
  ];
  if (objectives.maxLagSec !== undefined) goals.push({ kind: "lag", value: objectives.maxLagSec });
  const checks = goals.map((g) => checkGoal(g, r));
  const starChecks = stretch.slice(0, 2).map((g) => checkGoal(g, r));
  const passed = checks.every((c) => c.met);
  const stars = (passed ? 1 + starChecks.filter((c) => c.met).length : 0) as Evaluation["stars"];
  return { passed, stars, checks, starChecks };
}
