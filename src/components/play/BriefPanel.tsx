"use client";

import clsx from "clsx";
import { ArrowLeft, BookOpen, Check, Lightbulb, Target, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { topicHref } from "@/content/links";
import type { Level } from "@/content/types";
import { CLASS_LABELS, COMPONENTS } from "@/engine/components";
import { fmtLag, fmtMs, fmtPct, goalLabel } from "@/engine/scoring";
import type { Curve, RequestClass, Scenario } from "@/engine/types";
import { Stars } from "../ui";

const CURVES: Record<Curve, string> = {
  steady: "Steady all run",
  ramp: "Ramps up from 25% to peak",
  spike: "Calm, then a sudden spike to peak",
  wave: "Rises to peak mid-run, then falls",
};

const SANDBOX_CLASSES: RequestClass[] = ["read", "write", "static", "upload", "loc", "nearby", "message", "abuse"];

interface Props {
  level: Level;
  bestStars: number;
  backHref: string;
  backLabel: string;
  sandbox?: boolean;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  restored: boolean;
}

export function BriefPanel({ level, bestStars, backHref, backLabel, sandbox, scenario, onScenario, restored }: Props) {
  const [tab, setTab] = useState<"mission" | "recap">("mission");
  const [hints, setHints] = useState(0);
  const kicker =
    level.kind === "case" ? `Case study · Stage ${level.caseStudy!.stage}` : level.kind === "daily" ? "Daily challenge" : sandbox ? "Free play" : `Chapter ${level.chapter} · Lesson`;

  return (
    <aside className="flex max-h-[60vh] min-h-0 flex-col overflow-hidden bg-paper lg:max-h-none" aria-label="Level brief">
      <div className="border-b border-line px-5 pb-4 pt-4">
        <Link href={backHref} className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink">
          <ArrowLeft size={13} /> {backLabel}
        </Link>
        <p className="mt-3 text-xs font-medium text-signal">{kicker}</p>
        <h1 className="mt-1 text-2xl">{level.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{level.tagline}</p>
        {!sandbox && (
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
            <Stars count={bestStars} size={15} /> {bestStars ? "Your best" : "Not cleared yet"}
          </div>
        )}
        {restored && <p className="mt-2 rounded bg-cobalt-soft px-2 py-1 text-xs text-cobalt">Restored your unsaved draft. Use Reset to start over.</p>}
      </div>

      {!sandbox && (
        <div className="flex gap-1 border-b border-line px-3 text-sm font-medium" role="tablist">
          {(["mission", "recap"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              type="button"
              onClick={() => setTab(t)}
              className={clsx(
                "-mb-px border-b-2 px-3 py-2.5 capitalize transition-colors",
                tab === t ? "border-signal text-ink" : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm leading-relaxed">
        {tab === "recap" && !sandbox ? (
          <>
            <p className="text-ink-2">{level.concept.intro}</p>
            <ul className="space-y-2.5">
              {level.concept.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-ink-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-cobalt" />
                  {p}
                </li>
              ))}
            </ul>
            {level.kind !== "daily" && (
              <Link
                href={topicHref(level)}
                className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2.5 font-medium hover:border-ink/30"
              >
                <BookOpen size={16} className="text-cobalt" /> Read the full lesson
              </Link>
            )}
          </>
        ) : (
          <>
            {!sandbox && <p className="font-medium">{level.brief}</p>}
            {sandbox ? (
              <SandboxControls scenario={scenario} onScenario={onScenario} />
            ) : (
              <div>
                <h2 className="text-sm font-semibold">Traffic at peak</h2>
                <table className="mt-2 w-full font-mono text-xs">
                  <tbody>
                    {(Object.entries(level.scenario.traffic) as [RequestClass, number][]).map(([cls, rps]) => (
                      <tr key={cls} className="border-b border-line last:border-0">
                        <td className="py-1.5">{CLASS_LABELS[cls]}</td>
                        <td className="py-1.5 text-right tabular">{rps.toLocaleString()}/s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-ink-soft">{CURVES[level.scenario.curve]}.</p>
              </div>
            )}
            {!sandbox && (level.scenario.failures ?? []).length > 0 && (
              <div className="rounded-md border border-bad/30 bg-bad/5 p-3">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-bad">
                  <TriangleAlert size={15} /> Failures this run
                </h2>
                <ul className="mt-1 space-y-1 text-xs">
                  {level.scenario.failures!.map((f, i) => (
                    <li key={i}>
                      Second {f.at}: one {COMPONENTS[f.type].label} instance dies for {f.duration}s.
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!sandbox && (
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Target size={15} /> Goals
                </h2>
                <ul className="mt-2 space-y-1.5 text-xs">
                  <li className="flex items-start gap-2">
                    <Stars count={1} size={12} />
                    <span>
                      Availability ≥ {fmtPct(level.objectives.minAvailability)}, p95 ≤ {fmtMs(level.objectives.maxP95)}
                      {level.objectives.maxLagSec !== undefined && `, queue lag ≤ ${fmtLag(level.objectives.maxLagSec)}`}, within {level.budget} credits
                    </span>
                  </li>
                  {level.stretch.map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-[11px] font-bold text-gold">+★</span>
                      <span>{goalLabel(g)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!sandbox && (
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Lightbulb size={15} /> Hints
                </h2>
                <ol className="mt-2 space-y-2 text-xs">
                  {level.hints.slice(0, hints).map((h, i) => (
                    <li key={i} className="rounded border border-line bg-paper-2 px-2.5 py-2" data-testid="hint">
                      <b>{i + 1}.</b> {h}
                    </li>
                  ))}
                </ol>
                {hints < level.hints.length && (
                  <button type="button" onClick={() => setHints((h) => h + 1)} className="mt-2 text-xs font-semibold text-cobalt hover:underline">
                    Show hint {hints + 1} of {level.hints.length}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function SandboxControls({ scenario, onScenario }: { scenario: Scenario; onScenario: (s: Scenario) => void }) {
  const failing = (scenario.failures ?? []).length > 0;
  return (
    <div className="space-y-4">
      <p className="text-ink-soft">Experiment freely: set any traffic mix, pick a pattern, add a failure, and see what breaks. Nothing here is scored.</p>
      <div className="space-y-2">
        {SANDBOX_CLASSES.map((cls) => (
          <label key={cls} className="flex items-center justify-between gap-3 text-xs">
            <span>{CLASS_LABELS[cls]}</span>
            <input
              type="number"
              min={0}
              max={200000}
              step={100}
              aria-label={`${CLASS_LABELS[cls]} per second`}
              value={scenario.traffic[cls] ?? 0}
              onChange={(e) => onScenario({ ...scenario, traffic: { ...scenario.traffic, [cls]: Math.max(0, Math.min(200000, Number(e.target.value) || 0)) } })}
              className="w-28 rounded border border-line bg-paper px-2 py-1 text-right font-mono"
            />
          </label>
        ))}
      </div>
      <label className="flex items-center justify-between text-xs">
        <span>Pattern</span>
        <select
          value={scenario.curve}
          onChange={(e) => onScenario({ ...scenario, curve: e.target.value as Curve })}
          className="rounded border border-line bg-paper px-2 py-1"
        >
          {(Object.keys(CURVES) as Curve[]).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={failing}
          onChange={(e) => onScenario({ ...scenario, failures: e.target.checked ? [{ at: 15, duration: 8, type: "app", count: 1 }] : [] })}
        />
        Kill an app server instance at second 15
      </label>
    </div>
  );
}
