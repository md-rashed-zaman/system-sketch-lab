"use client";

import clsx from "clsx";
import { ArrowRight, Check, Copy, PencilRuler, RotateCw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { shareText } from "@/content/daily";
import type { Level } from "@/content/types";
import type { Check as CheckT, Evaluation } from "@/engine/scoring";
import type { Issue, SimResult } from "@/engine/types";
import { BADGES } from "@/lib/gamification";
import { Stars } from "../ui";

export interface ServerOutcome {
  evaluation: Evaluation;
  xpGained: number;
  totalXp: number;
  rank: string;
  streak: number;
  newBadges: string[];
  personalBest: boolean;
}

interface Props {
  level: Level;
  evaluation: Evaluation;
  sim: SimResult;
  outcome: ServerOutcome | null;
  saving: boolean;
  saveError: string | null;
  signedIn: boolean;
  sandbox?: boolean;
  nextHref?: string;
  shareUrl?: string;
  onEdit: () => void;
  onRetry: () => void;
}

export function ResultsPanel({ level, evaluation, sim, outcome, saving, saveError, signedIn, sandbox, nextHref, shareUrl, onEdit, onRetry }: Props) {
  const [copied, setCopied] = useState(false);
  const passed = evaluation.passed;
  const date = level.kind === "daily" ? level.id.slice("daily-".length) : null;

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-paper/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="rise w-full max-w-2xl rounded-xl border border-line bg-card ink-shadow" data-testid="results">
        <div className={clsx("flex items-center justify-between gap-4 rounded-t-[10px] border-b border-line px-6 py-5", passed ? "bg-ok/10" : "bg-bad/10")}>
          <div>
            <p className={clsx("font-mono text-xs uppercase tracking-[0.2em]", passed ? "text-ok" : "text-bad")}>{passed ? "Design holds" : "Design failed"}</p>
            <h2 id="result-title" className="mt-1 text-2xl font-semibold tracking-tight">
              {sandbox ? "Simulation complete" : passed ? (evaluation.stars === 3 ? "Flawless. Three stars." : "Passed. Room to improve.") : "It broke under load."}
            </h2>
          </div>
          {!sandbox && <Stars count={evaluation.stars} size={30} animate />}
        </div>

        <div className="space-y-6 px-6 py-5">
          <Timeline sim={sim} />

          {!sandbox && (
            <div className="grid gap-2 sm:grid-cols-2">
              {[...evaluation.checks, ...evaluation.starChecks].map((c, i) => (
                <CheckRow key={c.label} check={c} star={i >= evaluation.checks.length} />
              ))}
              <div className="flex items-center justify-between rounded-md border border-line bg-paper-2 px-3 py-2 text-xs">
                <span>Credits used</span>
                <b className="font-mono tabular">
                  {sim.credits} / {level.budget}
                </b>
              </div>
            </div>
          )}

          {!sandbox &&
            (outcome ? (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-cobalt-soft px-4 py-3 text-sm" data-testid="xp-result">
                <Sparkles size={18} className="text-cobalt" />
                <b className="font-mono">{outcome.xpGained > 0 ? `+${outcome.xpGained} XP` : "No new XP (beat your best stars to earn more)"}</b>
                <span className="text-ink-soft">
                  {outcome.totalXp} XP total · {outcome.rank} · {outcome.streak}-day streak
                </span>
                {outcome.newBadges.length > 0 && (
                  <div className="flex w-full flex-wrap gap-2 pt-1" data-testid="new-badges">
                    {outcome.newBadges.map((b) => (
                      <span key={b} className="rounded-full border border-line bg-gold/30 px-3 py-0.5 text-xs font-bold">
                        🏅 {BADGES.find((x) => x.id === b)?.title ?? b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : saving ? (
              <p className="text-sm text-ink-soft">Saving your run…</p>
            ) : saveError ? (
              <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{saveError}</p>
            ) : !signedIn ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-line px-4 py-3 text-sm">
                <span>Create a free account to save progress, earn XP and join the leaderboard.</span>
                <Link href={`/signup?next=/play/${level.id}`} className="rounded-md bg-ink px-3 py-1.5 font-semibold text-paper">
                  Save my progress
                </Link>
              </div>
            ) : null)}

          {sim.issues.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Post-mortem</h3>
              <ul className="mt-2 space-y-2" data-testid="issues">
                {sim.issues.slice(0, 6).map((issue, i) => (
                  <IssueRow key={i} issue={issue} />
                ))}
              </ul>
            </div>
          )}
          {sim.issues.length === 0 && <p className="text-sm text-ink-soft">No problems detected. Every component stayed healthy.</p>}

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold">
              <PencilRuler size={15} /> Edit design
            </button>
            <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold hover:bg-paper-2">
              <RotateCw size={15} /> Run again
            </button>
            {date && passed && shareUrl && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareText(date, evaluation.stars, sim.credits, sim.p95, shareUrl));
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold hover:bg-paper-2"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied!" : "Share score"}
              </button>
            )}
            {passed && nextHref && (
              <Link href={nextHref} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white shadow-sm">
                Next <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ check, star }: { check: CheckT; star: boolean }) {
  return (
    <div className={clsx("flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs", check.met ? "border-ok/30 bg-ok/5" : "border-bad/30 bg-bad/5")}>
      <span className="flex items-center gap-1.5">
        {check.met ? <Check size={13} className="text-ok" /> : <X size={13} className="text-bad" />}
        {star && <span className="font-bold text-gold">★</span>}
        {check.label}
      </span>
      <b className="font-mono tabular">{check.actual}</b>
    </div>
  );
}

function IssueRow({ issue }: { issue: Issue }) {
  const tone = issue.severity === "high" ? "border-bad text-bad" : issue.severity === "medium" ? "border-warn text-warn" : "border-ink-soft text-ink-soft";
  return (
    <li className={clsx("rounded-md border-l-4 bg-paper-2 px-3 py-2 text-sm", tone.split(" ")[0])}>
      <span className={clsx("mr-2 font-mono text-[10px] font-bold uppercase", tone.split(" ")[1])}>{issue.severity}</span>
      <span className="text-ink">{issue.message}</span>
    </li>
  );
}

/** Per-second bars: green = served, red = failed. Height = offered traffic. */
function Timeline({ sim }: { sim: SimResult }) {
  const max = Math.max(1, ...sim.ticks.map((t) => t.offered));
  const w = 600;
  const h = 70;
  const bw = w / sim.ticks.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" role="img" aria-label="Requests served and failed each second">
        {sim.ticks.map((t) => {
          const total = (t.offered / max) * (h - 4);
          const failed = t.offered > 0 ? (t.failed / t.offered) * total : 0;
          return (
            <g key={t.t}>
              <rect x={t.t * bw + 1} y={h - total} width={bw - 2} height={total - failed} fill="var(--color-ok)" opacity={0.8} />
              {failed > 0.2 && <rect x={t.t * bw + 1} y={h - failed} width={bw - 2} height={failed} fill="var(--color-bad)" />}
              {t.down.length > 0 && <rect x={t.t * bw} y={0} width={bw} height={3} fill="var(--color-bad)" />}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between gap-4 font-mono text-[11px] text-ink-soft">
        <span>Requests/s over the run · red = failed · top line = failure window</span>
        <span className="shrink-0 whitespace-nowrap">
          uptime {(sim.availability * 100).toFixed(2)}% · p95 {Math.round(sim.p95)}ms
        </span>
      </figcaption>
    </figure>
  );
}
