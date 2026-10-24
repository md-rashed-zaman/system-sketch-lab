import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Building2,
  Check,
  Clock,
  Coins,
  Cpu,
  Database,
  Film,
  Gamepad2,
  Gauge,
  Globe,
  HardDrive,
  Inbox,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareQuote,
  Network,
  Repeat,
  Scale,
  Server,
  Shield,
  ShieldCheck,
  Split,
  TrendingUp,
  TriangleAlert,
  Users,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Article, ArticleIcon, Level } from "@/content/types";
import { fmtMs, fmtPct } from "@/engine/scoring";
import { IconTile, LinkButton, Pill, ProBadge, Stars } from "../ui";
import { TOPIC_CONCEPTS } from "@/content/concepts";
import { ConceptAnimation } from "./ConceptAnimation";
import { FlowWalkthrough } from "./FlowWalkthrough";
import { Quiz } from "./Quiz";

const SECTION_ICONS: Record<ArticleIcon, LucideIcon> = {
  server: Server,
  database: Database,
  zap: Zap,
  shield: Shield,
  gauge: Gauge,
  layers: Layers,
  globe: Globe,
  clock: Clock,
  split: Split,
  repeat: Repeat,
  alert: TriangleAlert,
  coins: Coins,
  lock: Lock,
  activity: Activity,
  inbox: Inbox,
  "map-pin": MapPin,
  message: MessageCircle,
  film: Film,
  "hard-drive": HardDrive,
  users: Users,
  scale: Scale,
  cpu: Cpu,
  network: Network,
  "trending-up": TrendingUp,
};

/** What the visitor can do with the challenge: play it, or why not yet. */
export type PlayState = { kind: "play" } | { kind: "pro" } | { kind: "stage"; prevHref: string; prevTitle: string };

interface Props {
  level: Level;
  article: Article;
  kicker: string;
  back: { href: string; label: string };
  bestStars: number;
  play: PlayState;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function TopicPage({ level, article: a, kicker, back, bestStars, play }: Props) {
  const preview = play.kind === "pro";
  const sections = preview ? a.sections.slice(0, 1) : a.sections;
  const concepts = TOPIC_CONCEPTS[level.id] ?? [];
  const toc: [string, string][] = [
    ["overview", "Overview"],
    ["problem", "The problem"],
    ...(preview ? [] : ([["diagram", "The big picture"]] as [string, string][])),
    ...sections.map((s) => [slug(s.heading), s.heading] as [string, string]),
    ...(preview || !concepts.length ? [] : ([["motion", "See it in motion"]] as [string, string][])),
    ...(preview
      ? []
      : ([
          ["numbers", "Numbers to know"],
          ...(a.compare ? [["compare", "Side by side"]] : []),
          ["real-world", "In the real world"],
          ["mistakes", "Common mistakes"],
          ["interview", "In the interview"],
          ["quiz", "Check yourself"],
        ] as [string, string][])),
    ["challenge", "Your challenge"],
  ];

  return (
    <div className="flex-1">
      <header className="paper-grid border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
          <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            <ArrowLeft size={15} /> {back.label}
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5 font-medium text-signal">
              <BookOpen size={15} /> {kicker}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> {a.minutes} min read
            </span>
            <span aria-hidden>·</span>
            {level.pro ? <ProBadge /> : <Pill tone="ok">Free</Pill>}
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">{level.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{level.tagline}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <ChallengeButton level={level} play={play} />
            {bestStars > 0 && (
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <Stars count={bestStars} /> Your best
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 space-y-14">
          <section id="overview" className="scroll-mt-24">
            <p className="text-xl leading-9 text-ink-2">{a.overview}</p>
          </section>

          <section id="problem" className="scroll-mt-24 rounded-2xl border border-signal/25 bg-signal-soft/60 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-signal">
              <AlertTriangle size={16} /> The problem
            </h2>
            <p className="mt-3 text-[17px] leading-8 text-ink-2">{a.problem}</p>
          </section>

          {!preview && (
            <section id="diagram" className="scroll-mt-24 space-y-4">
              <Heading icon={Network} title="The big picture" />
              {a.diagrams.map((d) => (
                <FlowWalkthrough key={d.title} {...d} />
              ))}
            </section>
          )}

          {sections.map((s) => (
            <section key={s.heading} id={slug(s.heading)} className="scroll-mt-24">
              <Heading icon={SECTION_ICONS[s.icon] ?? BookOpen} title={s.heading} />
              <div className="mt-4 space-y-4 text-[17px] leading-8 text-ink-2">
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {s.bullets && (
                <ul className="mt-5 space-y-3">
                  {s.bullets.map((b) => {
                    // Numbered steps ("1. ...") get a number badge; everything else a check mark.
                    const step = /^(\d+)\.\s+([\s\S]*)$/.exec(b);
                    return (
                      <li key={b} className="flex gap-3 text-[16px] leading-7 text-ink-2">
                        {step ? (
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cobalt-soft font-mono text-xs font-semibold text-cobalt">
                            {step[1]}
                          </span>
                        ) : (
                          <Check size={18} className="mt-1 shrink-0 text-cobalt" />
                        )}
                        <span>{step ? step[2] : b}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}

          {!preview && concepts.length > 0 && (
            <section id="motion" className="scroll-mt-24 space-y-4">
              <Heading icon={Activity} title="See it in motion" />
              {concepts.map((c) => (
                <ConceptAnimation key={c} id={c} />
              ))}
            </section>
          )}

          {preview ? (
            <section className="rounded-2xl border border-line bg-card p-8 text-center" data-testid="topic-locked">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-3">
                <Lock size={20} />
              </span>
              <h2 className="mt-4 text-2xl font-semibold">The rest of this lesson is part of Pro</h2>
              <p className="mx-auto mt-2 max-w-md text-ink-soft">
                {a.sections.length - 1} more sections, diagrams, real-world examples, interview questions, a quiz and the hands-on challenge.
              </p>
              <LinkButton href="/pricing" variant="accent" className="mt-6">
                Unlock with Pro
              </LinkButton>
            </section>
          ) : (
            <>
              <section id="numbers" className="scroll-mt-24">
                <Heading icon={Gauge} title="Numbers to know" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {a.numbers.map((n) => (
                    <div key={n.label} className="rounded-xl border border-line bg-card px-5 py-4">
                      <p className="font-mono text-2xl font-semibold tabular text-cobalt">{n.value}</p>
                      <p className="mt-1 text-sm text-ink-soft">{n.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              {a.compare && (
                <section id="compare" className="scroll-mt-24">
                  <Heading icon={Scale} title="Side by side" />
                  <div className="mt-5 overflow-x-auto rounded-xl border border-line">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="bg-paper-2 text-left">
                        <tr>
                          <th className="px-4 py-3 font-medium text-ink-soft" />
                          {a.compare.headers.map((h) => (
                            <th key={h} className="px-4 py-3 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-card">
                        {a.compare.rows.map(([aspect, x, y]) => (
                          <tr key={aspect}>
                            <td className="px-4 py-3 font-medium text-ink-soft">{aspect}</td>
                            <td className="px-4 py-3 text-ink-2">{x}</td>
                            <td className="px-4 py-3 text-ink-2">{y}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section id="real-world" className="scroll-mt-24">
                <Heading icon={Building2} title="In the real world" />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {a.realWorld.map((r) => (
                    <div key={r.company} className="rounded-xl border border-line bg-card p-5">
                      <p className="flex items-center gap-2 font-semibold">
                        <Building2 size={16} className="text-ink-soft" /> {r.company}
                      </p>
                      <p className="mt-2 text-[15px] leading-7 text-ink-2">{r.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="mistakes" className="scroll-mt-24">
                <Heading icon={TriangleAlert} title="Common mistakes" tone="signal" />
                <ul className="mt-5 space-y-3">
                  {a.mistakes.map((m) => (
                    <li key={m} className="flex gap-3 text-[16px] leading-7 text-ink-2">
                      <XCircle size={18} className="mt-1 shrink-0 text-bad" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="interview" className="scroll-mt-24 rounded-2xl bg-cobalt-soft p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-cobalt">
                  <MessageSquareQuote size={18} /> In the interview
                </h2>
                <p className="mt-3 text-[16px] leading-7 text-ink-2">{a.interview.tip}</p>
                <p className="mt-5 text-sm font-semibold text-ink">Questions you may get</p>
                <ul className="mt-2 space-y-2">
                  {a.interview.questions.map((q) => (
                    <li key={q} className="flex gap-2 text-[15px] leading-7 text-ink-2">
                      <span className="text-cobalt">?</span> {q}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="quiz" className="scroll-mt-24">
                <Heading icon={Check} title="Check yourself" tone="ok" />
                <div className="mt-5">
                  <Quiz quiz={a.quiz} />
                </div>
              </section>
            </>
          )}

          <section id="challenge" className="scroll-mt-24">
            <ChallengeCard level={level} play={play} />
          </section>
        </article>

        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">On this page</p>
              <ul className="mt-3 space-y-2 border-l border-line text-sm">
                {toc.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="-ml-px block border-l border-transparent pl-3 text-ink-soft hover:border-ink hover:text-ink">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <ChallengeButton level={level} play={play} block />
          </nav>
        </aside>
      </div>
    </div>
  );
}

function Heading({ icon, title, tone = "cobalt" }: { icon: LucideIcon; title: string; tone?: "cobalt" | "signal" | "ok" }) {
  return (
    <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
      <IconTile icon={icon} tone={tone} size="sm" />
      {title}
    </h2>
  );
}

function ChallengeButton({ level, play, block }: { level: Level; play: PlayState; block?: boolean }) {
  const cls = block ? "w-full" : "";
  if (play.kind === "pro")
    return (
      <LinkButton href="/pricing" variant="accent" className={cls}>
        <Lock size={15} /> Unlock with Pro
      </LinkButton>
    );
  if (play.kind === "stage")
    return (
      <LinkButton href={play.prevHref} variant="outline" className={cls}>
        <Lock size={15} /> Finish {play.prevTitle} first
      </LinkButton>
    );
  return (
    <LinkButton href={`/play/${level.id}`} variant="accent" className={cls}>
      <Gamepad2 size={17} /> Start the challenge
    </LinkButton>
  );
}

function ChallengeCard({ level, play }: { level: Level; play: PlayState }) {
  const peak = Object.values(level.scenario.traffic).reduce((s, v) => s + (v ?? 0), 0);
  const facts: [LucideIcon, string, string][] = [
    [Activity, `${peak.toLocaleString()}/s`, "peak traffic"],
    [Coins, `${level.budget} credits`, "budget"],
    [ShieldCheck, fmtPct(level.objectives.minAvailability), "availability"],
    [Gauge, fmtMs(level.objectives.maxP95), "p95 latency"],
  ];
  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-[var(--shadow)] sm:p-8">
      <div className="flex items-center gap-3">
        <IconTile icon={Gamepad2} tone="signal" />
        <div>
          <p className="eyebrow">Your challenge</p>
          <h2 className="text-2xl font-semibold tracking-tight">Now build it</h2>
        </div>
      </div>
      <p className="mt-4 text-[16px] leading-7 text-ink-2">{level.brief}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map(([Icon, value, label]) => (
          <div key={label} className="rounded-xl bg-paper-2 px-4 py-3">
            <Icon size={16} className="text-ink-soft" />
            <dd className="mt-2 font-mono text-sm font-semibold tabular">{value}</dd>
            <dt className="text-xs text-ink-soft">{label}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-6">
        <ChallengeButton level={level} play={play} />
      </div>
    </div>
  );
}
