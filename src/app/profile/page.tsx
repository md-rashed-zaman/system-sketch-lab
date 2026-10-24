import { Award, Flame, Lock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ALL_LEVELS, LESSONS } from "@/content";
import { db } from "@/lib/db";
import { BADGES, rankFor } from "@/lib/gamification";
import { PLANS } from "@/lib/billing";
import { getBadges, getProgressMap } from "@/lib/progress";
import { getViewer } from "@/lib/session";
import { CancelPlanButton } from "@/components/CancelPlanButton";
import { LinkButton, ProBadge, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/profile");
  const { profile } = viewer;
  const { rank, next, progress: rankProgress } = rankFor(profile.xp);
  const progress = getProgressMap(viewer.id);
  const badges = new Map(getBadges(viewer.id).map((b) => [b.badge, b.earnedAt]));
  const recent = db()
    .prepare("select level_id as levelId, stars, credits, p95, created_at as createdAt from runs where user_id = ? order by id desc limit 8")
    .all(viewer.id) as { levelId: string; stars: number; credits: number; p95: number; createdAt: string }[];
  const titleOf = (id: string) => ALL_LEVELS.find((l) => l.id === id)?.title ?? id.replace("daily-", "Daily ");
  const lessonStars = LESSONS.reduce((s, l) => s + (progress.get(l.id)?.stars ?? 0), 0);

  return (
    <div className="paper-grid flex-1">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-cobalt text-2xl font-semibold tracking-tight text-white">{viewer.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <h1 className="text-3xl">{viewer.name}</h1>
            <p className="text-ink-soft">
              {rank.title} {viewer.pro && <ProBadge />}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="Total XP" value={profile.xp.toLocaleString()} testId="profile-xp" />
          <Stat label="Current streak" value={`${profile.streak} days`} icon={<Flame size={16} className="text-signal" />} />
          <Stat label="Best streak" value={`${profile.bestStreak} days`} />
          <Stat label="Lesson stars" value={`${lessonStars}/${LESSONS.length * 3}`} />
        </div>

        <div className="mt-6 rounded-xl border border-line bg-card p-5">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{rank.title}</span>
            <span className="text-ink-soft">{next ? `${next.min - profile.xp} XP to ${next.title}` : "Top rank reached"}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full border border-line bg-paper-2">
            <div className="h-full bg-signal" style={{ width: `${Math.round(rankProgress * 100)}%` }} />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Award size={22} /> Badges
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="badges">
              {BADGES.map((b) => {
                const earned = badges.get(b.id);
                return (
                  <li key={b.id} className={`rounded-md border p-3 ${earned ? "border-gold/40 bg-gold/10" : "border-line bg-card opacity-60"}`} data-earned={earned ? "yes" : "no"}>
                    <p className="flex items-center gap-2 font-semibold">
                      {earned ? "🏅" : <Lock size={14} />} {b.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{b.description}</p>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Plan</h2>
              <div className="mt-4 rounded-xl border border-line bg-card p-5" data-testid="plan">
                {viewer.pro ? (
                  <>
                    <p className="font-semibold">{PLANS[profile.plan as keyof typeof PLANS].label}</p>
                    <p className="mt-1 text-sm text-ink-soft">All chapters and case studies are unlocked.</p>
                    <CancelPlanButton />
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Free</p>
                    <p className="mt-1 text-sm text-ink-soft">Chapters 1-3, the Uber case study and the daily challenge.</p>
                    <LinkButton href="/pricing" variant="accent" className="mt-4">
                      Upgrade to Pro
                    </LinkButton>
                  </>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Recent runs</h2>
              {recent.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">No runs yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card" data-testid="recent-runs">
                  {recent.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate">{titleOf(r.levelId)}</span>
                      <Stars count={r.stars} size={13} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, testId }: { label: string; value: string; icon?: React.ReactNode; testId?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-5 py-4">
      <p className="flex items-center gap-2 font-mono text-2xl font-semibold tabular" data-testid={testId}>
        {icon}
        {value}
      </p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
