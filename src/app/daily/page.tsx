import { ArrowRight, Flame } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { dailyLevel, dayNumber, todayUtc } from "@/content/daily";
import { CLASS_LABELS } from "@/engine/components";
import type { RequestClass } from "@/engine/types";
import { LinkButton, Stars } from "@/components/ui";
import { dailyLeaderboard, getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Daily challenge", description: "One system design puzzle a day, the same for everyone." };

export default async function DailyPage() {
  const today = todayUtc();
  const level = dailyLevel(today);
  const viewer = await getViewer();
  const best = viewer ? getProgressMap(viewer.id).get(level.id) : undefined;
  const board = dailyLeaderboard(today, 20);
  const past = Array.from({ length: 6 }, (_, i) => new Date(Date.parse(`${today}T00:00:00Z`) - (i + 1) * 86_400_000).toISOString().slice(0, 10)).filter(
    (d) => dayNumber(d) >= 1,
  );

  return (
    <div className="paper-grid flex-1">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="eyebrow">Daily challenge · {today}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{level.title}</h1>
          <p className="mt-4 text-lg text-ink-2">{level.brief}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.entries(level.scenario.traffic) as [RequestClass, number][]).map(([cls, rps]) => (
              <div key={cls} className="rounded-xl border border-line bg-card px-4 py-3">
                <p className="font-mono text-xl font-semibold tabular">{rps.toLocaleString()}/s</p>
                <p className="text-xs text-ink-soft">{CLASS_LABELS[cls]}</p>
              </div>
            ))}
            <div className="rounded-xl border border-cobalt/25 bg-cobalt-soft px-4 py-3">
              <p className="font-mono text-xl font-semibold tabular text-cobalt">{level.budget} cr</p>
              <p className="text-xs text-ink-soft">budget</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LinkButton href={`/play/${level.id}`} variant="accent" className="px-6 py-3 text-base">
              <Flame size={17} /> {best ? "Improve your score" : "Play today's puzzle"}
            </LinkButton>
            {best && (
              <span className="flex items-center gap-2 text-sm">
                Your best: <Stars count={best.stars} /> <span className="font-mono">{best.credits} cr · p95 {Math.round(best.p95)} ms</span>
              </span>
            )}
          </div>
          <div className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">Previous days</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {past.map((d) => {
                const l = dailyLevel(d);
                return (
                  <li key={d}>
                    <Link href={`/play/${l.id}`} className="flex items-center justify-between rounded-xl border border-line bg-card px-3 py-2 text-sm hover:border-ink/30">
                      <span>
                        <span className="font-mono text-xs text-ink-soft">{d}</span> · {l.title.replace(/^Daily #\d+: /, "")}
                      </span>
                      <ArrowRight size={14} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-card p-6 ink-shadow" aria-labelledby="today-board">
          <h2 id="today-board" className="text-xl font-semibold tracking-tight">
            Today&apos;s leaderboard
          </h2>
          <p className="text-xs text-ink-soft">Ranked by stars, then fewest credits, then lowest p95.</p>
          {board.length === 0 ? (
            <p className="mt-6 text-sm text-ink-soft">No scores yet today. Be the first.</p>
          ) : (
            <ol className="mt-4 divide-y divide-line" data-testid="daily-board">
              {board.map((r, i) => (
                <li key={r.userId} className={`flex items-center gap-3 py-2.5 text-sm ${r.userId === viewer?.id ? "font-bold" : ""}`}>
                  <span className="w-6 shrink-0 font-mono text-ink-soft">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  <Stars count={r.stars} size={13} className="shrink-0" />
                  <span className="shrink-0 whitespace-nowrap text-right font-mono text-xs tabular">
                    {r.credits} cr · {Math.round(r.p95)}ms
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
