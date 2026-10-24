import { ArrowRight, ArrowUpRight, Check, Flame, Lock, Star } from "lucide-react";
import Link from "next/link";
import { CASE_STUDIES, CHAPTERS, LESSONS } from "@/content";
import { HeroBlueprint } from "@/components/HeroBlueprint";
import { ICONS, TINT } from "@/components/play/icons";
import { CASE_ICONS, CHAPTER_ICONS } from "@/components/topicIcons";
import { LinkButton, ProBadge } from "@/components/ui";
import type { ComponentType } from "@/engine/types";

const CONCEPTS = ["Load balancing", "Caching", "CDNs", "Replication", "Sharding", "Message queues", "Rate limiting", "WebSockets", "Geo search", "Fan-out", "Failover", "Back-pressure", "Consistent hashing", "Chaos testing"];

const FAQ = [
  ["Do I need to know system design already?", "No. Lesson one is three boxes. Every lesson explains one idea from scratch, with diagrams, before you build anything."],
  ["Is the simulation realistic?", "It is a teaching model with real-world ratios: caches answer ~80% of reads, database writes cost more than reads, and latency climbs sharply past ~70% load."],
  ["What is free?", "Chapters 1-3, the full How Uber works case study, the daily puzzle, the sandbox and leaderboards. Pro unlocks everything else, including every future case study."],
  ["Will it help in interviews?", "Each lesson ends with the follow-up questions interviewers actually ask, and the case studies mirror the classic prompts: design Uber, WhatsApp, Netflix, a Twitter feed."],
];

function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="eyebrow flex items-center gap-3">
      <span className="text-signal">{n}</span>
      <span className="h-px w-8 bg-line" aria-hidden />
      {children}
    </p>
  );
}

function Chip({ type, size = 30 }: { type: ComponentType; size?: number }) {
  const Icon = ICONS[type];
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-lg" style={{ width: size, height: size, background: `color-mix(in oklab, ${TINT[type]} 16%, transparent)`, color: TINT[type] }}>
      <Icon size={size * 0.55} />
    </span>
  );
}

export default function Home() {
  const studies = CASE_STUDIES.filter((c) => !c.comingSoon);
  return (
    <>
      {/* ------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1fr_1.12fr] lg:pb-24 lg:pt-20">
          <div className="rise">
            <p className="eyebrow">System design · learn by doing</p>
            <h1 className="mt-6 text-[2.75rem] sm:text-6xl lg:text-[4.1rem]">
              Learn system design by{" "}
              <span className="whitespace-nowrap">
                <span className="relative inline-block">
                  <em>breaking</em>
                  <svg viewBox="0 0 220 18" className="absolute -bottom-2 left-0 w-full" aria-hidden>
                    <path className="draw" style={{ ["--len" as string]: 240 }} d="M3,12 C40,4 70,15 110,8 C150,2 185,14 217,6" fill="none" stroke="var(--signal)" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                it.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft">
              Interactive lessons, a live architecture canvas and real traffic that pushes back. See how Uber, WhatsApp and Netflix actually scale, then build them yourself.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <LinkButton href="/learn/hello-server" variant="accent" className="rounded-full px-6 py-3 text-base">
                Start learning free <ArrowRight size={17} />
              </LinkButton>
              <LinkButton href="/case-studies" variant="ghost" className="rounded-full px-5 py-3 text-base">
                Explore case studies
              </LinkButton>
            </div>
            <p className="mt-8 font-mono text-xs text-ink-soft">
              {LESSONS.length} lessons <span className="mx-2 text-line">/</span> {studies.length} case studies <span className="mx-2 text-line">/</span> new puzzle daily{" "}
              <span className="mx-2 text-line">/</span> no card needed
            </p>
          </div>

          <div className="rise relative" style={{ animationDelay: "150ms" }}>
            <div className="rounded-[1.75rem] border border-line bg-card p-2 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between px-4 py-3 font-mono text-[11px] text-ink-soft">
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                  </span>
                  live · flash-sale.sim
                </span>
                <span className="hidden gap-4 sm:flex">
                  <span>
                    p95 <b className="text-ink">62ms</b>
                  </span>
                  <span>
                    uptime <b className="text-ink">99.97%</b>
                  </span>
                </span>
              </div>
              <div className="blueprint rounded-[1.35rem] border border-line px-2 py-4 sm:px-4">
                <HeroBlueprint />
              </div>
            </div>
            <p className="marker absolute -bottom-9 left-6 rotate-[-3deg] text-2xl">you&apos;ll fix this in chapter 2 ↑</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Concept ticker */}
      <div className="overflow-hidden border-y border-line bg-paper-2 py-4" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-mono text-sm uppercase tracking-[0.18em] text-ink-soft">
          {[...CONCEPTS, ...CONCEPTS].map((c, i) => (
            <span key={i} className="flex items-center gap-10">
              {c} <span className="text-signal">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
        <Eyebrow n="01">How it works</Eyebrow>
        <h2 className="display mt-5 max-w-3xl text-4xl sm:text-5xl">
          Read it. Build it. <em className="whitespace-nowrap">Break it.</em>
        </h2>
        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <Step n="1" title="Read a real explanation" text="Diagrams that animate hop by hop, real-world examples from big tech, and a quick quiz.">
            <div className="space-y-2">
              <div className="h-2 w-3/4 rounded-full bg-ink/15" />
              <div className="h-2 w-full rounded-full bg-ink/10" />
              <div className="h-2 w-5/6 rounded-full bg-ink/10" />
              <div className="flex items-center gap-1.5 pt-2">
                <Chip type="client" size={24} />
                <span className="h-px w-4 bg-ink/25" />
                <Chip type="lb" size={24} />
                <span className="h-px w-4 bg-ink/25" />
                <Chip type="app" size={24} />
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-ok/15 px-2 py-0.5 text-[10px] font-semibold text-ok">
                  <Check size={10} /> 3/3
                </span>
              </div>
            </div>
          </Step>
          <Step n="2" title="Build it on a budget" text="Drag real components onto a live canvas. Every instance costs credits, and the budget is fixed.">
            <div className="blueprint relative flex h-full items-center justify-center gap-2 rounded-xl border border-line">
              <Chip type="client" size={28} />
              <span className="h-px w-5 bg-ink/30" />
              <Chip type="app" size={28} />
              <span className="h-px w-5 bg-ink/30" />
              <Chip type="cache" size={28} />
              <span className="h-px w-5 bg-ink/30" />
              <Chip type="sqldb" size={28} />
            </div>
          </Step>
          <Step n="3" title="Survive real traffic" text="Spikes, bots and crashing servers hit your design. Read the post-mortem, then go for three stars.">
            <div className="flex h-full items-end gap-1">
              {[30, 34, 32, 38, 36, 42, 90, 96, 88, 40, 36, 34, 38, 35].map((h, i) => (
                <span key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: h > 80 ? "#ef4444" : "color-mix(in oklab, var(--ink) 22%, transparent)" }} />
              ))}
            </div>
          </Step>
        </ol>
      </section>

      {/* ------------------------------------------------ Bento */}
      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <Eyebrow n="02">Why it sticks</Eyebrow>
          <h2 className="display mt-5 max-w-3xl text-4xl sm:text-5xl">
            Courses tell you. <em>We let you watch it fail.</em>
          </h2>
          <div className="mt-14 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
            <Tile className="lg:col-span-5 lg:row-span-2" title="Post-mortems in plain English" text="Every run ends with exactly what broke, where, and how to fix it.">
              <div className="mt-6 space-y-2.5">
                {[
                  ["HIGH", "App Server is at 140% load. Add instances or cache reads.", "#ef4444"],
                  ["MED", "Queue backlog peaked at 12,000 jobs (40s of lag).", "#f59e0b"],
                  ["OK", "The cache answered 81% of reads.", "#22c55e"],
                ].map(([sev, text, color]) => (
                  <div key={sev} className="flex gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
                    <span className="font-mono text-[11px] font-bold" style={{ color }}>
                      {sev}
                    </span>
                    <span className="text-ink-2">{text}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-3">
                  {[0, 1, 2].map((i) => (
                    <Star key={i} size={22} className={i < 2 ? "fill-gold text-gold" : "text-ink/20"} />
                  ))}
                  <span className="marker ml-2 text-xl">so close!</span>
                </div>
              </div>
            </Tile>
            <Tile className="lg:col-span-4" title="Real trade-offs" text="A fixed budget forces the calls interviewers ask about.">
              <div className="mt-5">
                <div className="flex justify-between font-mono text-xs text-ink-soft">
                  <span>credits</span>
                  <span className="text-ink">74 / 90</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-3">
                  <div className="h-full w-[82%] rounded-full bg-warn" />
                </div>
              </div>
            </Tile>
            <Tile className="lg:col-span-3" title="Streaks & XP" text="Seven ranks, fourteen badges.">
              <p className="mt-3 flex items-baseline gap-2">
                <span className="display text-5xl">12</span>
                <Flame size={22} className="text-signal" />
                <span className="text-sm text-ink-soft">day streak</span>
              </p>
            </Tile>
            <Tile className="lg:col-span-3" title="Daily puzzle" text="Same puzzle worldwide, every day.">
              <pre className="mt-4 rounded-xl border border-line bg-paper px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-2">{"Daily #297 ⭐⭐⭐\n74 credits · p95 62ms"}</pre>
            </Tile>
            <Tile className="lg:col-span-4" title="Interview-ready" text="Every lesson ends with the follow-ups you will actually get.">
              <p className="marker mt-4 text-2xl leading-tight">&ldquo;Why not shard right away?&rdquo;</p>
            </Tile>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Metro map */}
      <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow n="03">The path</Eyebrow>
            <h2 className="display mt-5 text-4xl sm:text-5xl">
              From one server to <em className="whitespace-nowrap">planet scale.</em>
            </h2>
          </div>
          <Link href="/learn" className="inline-flex items-center gap-1.5 font-medium text-ink-soft hover:text-ink">
            See all {LESSONS.length} lessons <ArrowUpRight size={16} />
          </Link>
        </div>
        <ol className="relative mt-16 grid gap-10 lg:grid-cols-6 lg:gap-4">
          <span className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-[linear-gradient(var(--cobalt)_50%,transparent_50%)] lg:hidden" aria-hidden />
          <span className="absolute left-[8%] right-[8%] top-[22px] hidden h-0.5 lg:block" aria-hidden>
            <span className="absolute inset-y-0 left-0 w-1/2 bg-cobalt" />
            <span className="absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(90deg,var(--ink-soft)_0_6px,transparent_6px_12px)] opacity-60" />
          </span>
          {CHAPTERS.map((c) => {
            const Icon = CHAPTER_ICONS[c.id];
            return (
              <li key={c.id} className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                <Link
                  href="/learn"
                  className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-paper transition hover:scale-110 ${c.pro ? "border-ink-soft/50 text-ink-soft" : "border-cobalt text-cobalt"}`}
                  aria-label={`Chapter ${c.id}: ${c.title}`}
                >
                  <Icon size={18} />
                </Link>
                <div className="lg:mt-5">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                    Ch {c.id} · {c.levels.length} lessons
                  </p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug">{c.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{c.blurb}</p>
                  <p className="mt-2">{c.pro ? <ProBadge /> : <span className="text-xs font-semibold text-ok">Free</span>}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ------------------------------------------------ Case studies */}
      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <Eyebrow n="04">Case studies</Eyebrow>
          <h2 className="display mt-5 max-w-3xl text-4xl sm:text-5xl">
            Don&apos;t just read how Uber works. <em className="whitespace-nowrap">Build it.</em>
          </h2>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {studies.map((c) => {
              const Icon = CASE_ICONS[c.slug];
              const finalStage = c.stages[c.stages.length - 1];
              return (
                <Link key={c.slug} href={`/case-studies/${c.slug}`} className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-card p-7 transition hover:-translate-y-1 hover:shadow-[var(--shadow)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-3 text-ink">
                      <Icon size={22} />
                    </span>
                    {c.pro ? <ProBadge /> : <span className="rounded-full bg-ok/12 px-3 py-1 text-xs font-semibold text-ok">Free</span>}
                  </div>
                  <h3 className="display mt-8 text-3xl">{c.title}</h3>
                  <p className="mt-3 max-w-md text-ink-soft">{c.blurb}</p>
                  <div className="mt-8 flex items-center justify-between border-t border-dashed border-line pt-5">
                    <span className="flex items-center gap-1.5" aria-label="Components you will use">
                      {finalStage.palette.slice(0, 6).map((t) => (
                        <Chip key={t} type={t} size={28} />
                      ))}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-soft group-hover:text-ink">
                      {c.stages.length} stages <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ FAQ */}
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <Eyebrow n="05">FAQ</Eyebrow>
          <h2 className="display mt-5 text-4xl sm:text-5xl">
            Questions, <em className="whitespace-nowrap">answered.</em>
          </h2>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                {q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line font-sans text-lg text-ink-soft transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-ink px-6 py-20 text-center text-paper sm:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(var(--paper)_1px,transparent_1.2px)] [background-size:22px_22px]" aria-hidden />
          <h2 className="display relative mx-auto max-w-3xl text-5xl sm:text-7xl">
            Your first outage is <em className="whitespace-nowrap">a few clicks</em> away.
          </h2>
          <p className="relative mt-5 text-paper/70">Free to start. Learn at your own pace, from anywhere.</p>
          <div className="relative mt-10 flex flex-wrap justify-center gap-3">
            <LinkButton href="/learn/hello-server" variant="accent" className="rounded-full px-6 py-3 text-base">
              Start lesson 1 <ArrowRight size={17} />
            </LinkButton>
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-full border border-paper/25 px-6 py-3 text-base font-semibold text-paper hover:bg-paper/10">
              <Lock size={15} /> See pricing
            </Link>
          </div>
          <p className="marker relative mt-8 rotate-[-2deg] text-2xl">no card needed ✓</p>
        </div>
      </section>
    </>
  );
}

function Step({ n, title, text, children }: { n: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <li className="group">
      <div className="flex items-end gap-4">
        <span className="display text-7xl leading-none text-signal">0{n}</span>
        <span className="mb-4 h-px flex-1 bg-line" aria-hidden />
      </div>
      <div className="mt-6 h-32 rounded-2xl border border-line bg-card p-4 transition group-hover:shadow-[var(--shadow)]">{children}</div>
      <h3 className="mt-6 text-xl font-semibold">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-soft">{text}</p>
    </li>
  );
}

function Tile({ title, text, className, children }: { title: string; text: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col rounded-[1.5rem] border border-line bg-card p-6 ${className ?? ""}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>
      {children}
    </div>
  );
}
