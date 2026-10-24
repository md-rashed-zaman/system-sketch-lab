import { COMPONENTS, PLACEABLE } from "@/engine/components";
import { design } from "@/engine/design";
import { evaluate } from "@/engine/scoring";
import { designCredits, simulate } from "@/engine/simulate";
import type { Design, Failure, RequestClass, Scenario } from "@/engine/types";
import type { Level } from "./types";

const EPOCH = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;

/** Daily challenge number for a UTC date string (YYYY-MM-DD); #1 is 1 Jan 2026. */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS) + 1;
}

export function todayUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const t = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === date && t >= EPOCH;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Template {
  key: string;
  title: string;
  brief: (t: Scenario["traffic"]) => string;
  traffic: (r: () => number) => Scenario["traffic"];
  curve: Scenario["curve"][];
  /** Starting topology for the auto-solver; instance counts are tuned afterwards. */
  topology: Design;
}

const round = (x: number, step: number) => Math.max(step, Math.round(x / step) * step);
const between = (r: () => number, lo: number, hi: number, step = 100) => round(lo + r() * (hi - lo), step);
const fmt = (n: number | undefined) => (n ?? 0).toLocaleString("en-US");

const TEMPLATES: Template[] = [
  {
    key: "read-heavy",
    title: "Read storm",
    brief: (t) => `A recipe site is trending: ${fmt(t.read)} reads and ${fmt(t.write)} writes per second.`,
    traffic: (r) => ({ read: between(r, 2500, 6000), write: between(r, 100, 400, 50) }),
    curve: ["steady", "wave", "ramp"],
    topology: design([["lb", "lb"], ["app", "app", 3], ["cache", "cache"], ["db", "sqldb"]], ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"]),
  },
  {
    key: "static-heavy",
    title: "Image flood",
    brief: (t) => `A meme gallery serves ${fmt(t.static)} image requests, ${fmt(t.read)} reads and ${fmt(t.write)} writes per second.`,
    traffic: (r) => ({ static: between(r, 6000, 20000, 500), read: between(r, 500, 2000), write: between(r, 50, 200, 50) }),
    curve: ["steady", "wave"],
    topology: design(
      [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb"], ["app", "app", 2], ["cache", "cache"], ["db", "sqldb"]],
      ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
    ),
  },
  {
    key: "write-burst",
    title: "Checkout rush",
    brief: (t) => `A flash sale: up to ${fmt(t.write)} orders and ${fmt(t.read)} reads per second in a short burst.`,
    traffic: (r) => ({ read: between(r, 500, 1500), write: between(r, 500, 1000, 50) }),
    curve: ["spike"],
    topology: design(
      [["lb", "lb"], ["app", "app", 2], ["cache", "cache"], ["db", "sqldb"], ["queue", "queue"], ["worker", "worker", 2], ["kv", "nosql"]],
      ["users>lb", "lb>app", "app>cache", "cache>db", "app>db", "app>queue", "queue>worker", "worker>kv"],
    ),
  },
  {
    key: "bots",
    title: "Scraper siege",
    brief: (t) => `A price-comparison API: ${fmt(t.read)} reads and ${fmt(t.write)} writes per second from people, ${fmt(t.abuse)} from bots.`,
    traffic: (r) => ({ read: between(r, 1000, 3000), write: between(r, 100, 300, 50), abuse: between(r, 3000, 9000, 500) }),
    curve: ["steady", "ramp"],
    topology: design([["gw", "gateway"], ["app", "app", 2], ["cache", "cache"], ["db", "sqldb"]], ["users>gw", "gw>app", "app>cache", "cache>db", "app>db"]),
  },
  {
    key: "realtime",
    title: "Chat frenzy",
    brief: (t) => `A live-event chat: ${fmt(t.message)} messages and ${fmt(t.read)} reads per second.`,
    traffic: (r) => ({ message: between(r, 4000, 12000, 500), read: between(r, 500, 1500) }),
    curve: ["steady", "wave"],
    topology: design(
      [["lb", "lb"], ["ws", "ws", 2], ["kv", "nosql", 2], ["app", "app", 2], ["cache", "cache"]],
      ["users>lb", "lb>ws", "ws>kv", "lb>app", "app>cache", "cache>kv", "app>kv"],
    ),
  },
  {
    key: "geo",
    title: "Scooter swarm",
    brief: (t) => `A scooter-sharing app: ${fmt(t.loc)} location pings, ${fmt(t.nearby)} nearby searches and ${fmt(t.read)} reads per second.`,
    traffic: (r) => ({ loc: between(r, 4000, 12000, 500), nearby: between(r, 500, 2000), read: between(r, 200, 600) }),
    curve: ["steady", "wave"],
    topology: design(
      [["lb", "lb"], ["ws", "ws", 2], ["geo", "geo"], ["app", "app", 2], ["cache", "cache"], ["db", "sqldb"]],
      ["users>lb", "lb>ws", "ws>geo", "lb>app", "app>geo", "app>cache", "cache>db", "app>db"],
    ),
  },
];

const OBJECTIVES = { minAvailability: 0.99, maxP95: 150 };

const CURVE_TEXT: Record<Scenario["curve"], string> = {
  steady: "Traffic holds at peak the whole run.",
  ramp: "Traffic ramps up from a quarter of peak.",
  spike: "Traffic is calm, then spikes to peak.",
  wave: "Traffic rises to peak mid-run, then falls.",
};

/** Greedy auto-solver: scale the hottest component until the design passes. Used to size the budget. */
export function autoSolve(start: Design, scenario: Scenario): Design {
  let d: Design = structuredClone(start);
  for (let i = 0; i < 60; i++) {
    const r = simulate(d, scenario);
    const e = evaluate(OBJECTIVES, [], r);
    const hot = Object.entries(r.peakUtil)
      .map(([id, p]) => ({ id, u: Number.isFinite(p.u) ? p.u : 99 }))
      .filter(({ id }) => {
        const n = d.nodes.find((x) => x.id === id)!;
        return n.instances < COMPONENTS[n.type].maxInstances;
      })
      .sort((a, b) => b.u - a.u)[0];
    // Keep scaling until the design passes with comfortable headroom (all nodes under 75%).
    if (e.passed && (!hot || hot.u <= 0.75)) break;
    if (!hot) break;
    d = { ...d, nodes: d.nodes.map((n) => (n.id === hot.id ? { ...n, instances: n.instances + 1 } : n)) };
  }
  return d;
}

export function dailyLevel(date: string): Level {
  const n = dayNumber(date);
  const r = rng(n * 2654435761);
  const template = TEMPLATES[Math.floor(r() * TEMPLATES.length)];
  const traffic = template.traffic(r);
  const curve = template.curve[Math.floor(r() * template.curve.length)];
  const failures: Failure[] = r() < 0.5 ? [{ at: 14 + Math.floor(r() * 12), duration: 6, type: "app", count: 1 }] : [];
  const scenario: Scenario = { traffic, curve, failures };
  const solution = autoSolve(template.topology, scenario);
  const sim = simulate(solution, scenario);
  const credits = designCredits(solution);
  const classes = Object.keys(traffic) as RequestClass[];

  return {
    id: `daily-${date}`,
    kind: "daily",
    title: `Daily #${n}: ${template.title}`,
    tagline: "One puzzle a day, the same for everyone.",
    concept: {
      intro: "The daily challenge mixes everything you have learned. Build from scratch, then compare your score with everyone else's.",
      points: ["Score order: stars, then fewer credits, then lower p95 latency.", "You can retry as often as you like; your best run counts."],
      tradeoffs: [],
      interviewTip: "Practising small, varied designs every day builds the instinct interviews reward.",
    },
    brief: `${template.brief(traffic)}${failures.length ? " An app server will crash mid-run." : ""} ${CURVE_TEXT[curve]}`,
    palette: PLACEABLE,
    start: design([], []),
    scenario,
    budget: Math.ceil((credits * 1.25) / 5) * 5,
    objectives: OBJECTIVES,
    stretch: [
      { kind: "credits", value: Math.ceil((credits * 1.05) / 5) * 5 },
      { kind: "p95", value: Math.max(30, Math.ceil((sim.p95 * 1.15) / 5) * 5) },
    ],
    hints: [
      `This puzzle carries ${classes.length} kinds of traffic: route each to the cheapest component that can serve it.`,
      failures.length ? "One app server will die mid-run: keep a spare instance behind a load balancer." : "Size every tier for the peak, around 70% utilisation.",
      "Run early and read the post-mortem: it names the bottleneck.",
    ],
    solution,
    pro: false,
    xpPerStar: 30,
  };
}

/** Spoiler-free share text, Wordle style. */
export function shareText(date: string, stars: number, credits: number, p95: number, url: string): string {
  const grid = ["⭐", "⭐", "⭐"].map((s, i) => (i < stars ? s : "▫️")).join("");
  return `System Sketch Lab Daily #${dayNumber(date)} ${grid}\n${credits} credits · p95 ${Math.round(p95)} ms\n${url}`;
}
