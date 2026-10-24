import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { todayUtc } from "@/content/daily";
import { Stars } from "@/components/ui";
import { dailyLeaderboard, xpLeaderboard } from "@/lib/progress";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === "daily" ? "daily" : "xp";
  const viewer = await getViewer();
  const today = todayUtc();
  const xp = tab === "xp" ? xpLeaderboard(50) : [];
  const daily = tab === "daily" ? dailyLeaderboard(today, 50) : [];

  return (
    <div className="paper-grid flex-1">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex items-center gap-3">
          <Trophy className="text-gold" size={30} />
          <h1 className="text-4xl">Leaderboard</h1>
        </div>
        <div className="mt-6 inline-flex rounded-xl border border-line bg-card p-1 text-sm font-semibold" role="tablist">
          {[
            ["xp", "All-time XP"],
            ["daily", `Today's daily (${today})`],
          ].map(([k, label]) => (
            <Link key={k} href={`/leaderboard?tab=${k}`} role="tab" aria-selected={tab === k} className={`rounded px-4 py-1.5 ${tab === k ? "bg-paper-3 text-ink" : "text-ink-soft hover:text-ink"}`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-card">
          <table className="w-full text-sm" data-testid="leaderboard">
            <thead className="border-b border-line bg-paper-2 text-left font-mono text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-normal">#</th>
                <th className="px-4 py-3 font-normal">Engineer</th>
                <th className="px-4 py-3 text-right font-normal">{tab === "xp" ? "Rank" : "Score"}</th>
                <th className="px-4 py-3 text-right font-normal">{tab === "xp" ? "XP" : "Credits · p95"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tab === "xp" &&
                xp.map((r, i) => (
                  <tr key={r.userId} className={r.userId === viewer?.id ? "bg-signal-soft font-semibold" : ""}>
                    <td className="px-4 py-3 font-mono text-ink-soft">{i + 1}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 text-right text-ink-soft">{r.rank}</td>
                    <td className="px-4 py-3 text-right font-mono tabular">{r.xp.toLocaleString()}</td>
                  </tr>
                ))}
              {tab === "daily" &&
                daily.map((r, i) => (
                  <tr key={r.userId} className={r.userId === viewer?.id ? "bg-signal-soft font-semibold" : ""}>
                    <td className="px-4 py-3 font-mono text-ink-soft">{i + 1}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Stars count={r.stars} size={14} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {r.credits} · {Math.round(r.p95)} ms
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {((tab === "xp" && xp.length === 0) || (tab === "daily" && daily.length === 0)) && <p className="px-4 py-10 text-center text-ink-soft">No entries yet. Play a level to get on the board.</p>}
        </div>
      </div>
    </div>
  );
}
