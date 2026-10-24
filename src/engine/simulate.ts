import { CACHE_HIT, CDN_HIT, CLASS_LABELS, COMPONENTS, QUEUE_MAX_BACKLOG, weight } from "./components";
import type {
  ComponentType,
  Curve,
  Design,
  DesignNode,
  Issue,
  RequestClass,
  Scenario,
  SimResult,
  TickResult,
} from "./types";

/**
 * Flow model, evaluated once per tick:
 * 1. Enumerate every path a request of each class can take (equal split across eligible next hops).
 * 2. Sum load per node (rps x path probability x per-class weight) and compute utilisation.
 * 3. Walk the paths again: an overloaded node sheds the excess (ok = 1/u) and adds queueing delay (1/(1-u)).
 * Queues hold work across ticks; workers drain it into the databases behind them.
 */

const DEFAULT_TICKS = 40;
const MAX_PATHS = 4_000;
const MAX_FACTOR = 25;

type EndKind = "served" | "queued" | "blocked" | "dead";
interface Path {
  prob: number;
  nodes: string[];
  end: EndKind;
}

type Action =
  | { kind: "serve"; hit: number }
  | { kind: "queue" }
  | { kind: "block" }
  | { kind: "pass" }
  | { kind: "reject" };

const PASS: Action = { kind: "pass" };
const REJECT: Action = { kind: "reject" };
const serve = (hit: number): Action => ({ kind: "serve", hit });

const DB_CLASSES: RequestClass[] = ["read", "write", "loc", "message", "nearby", "abuse"];

/** What a component does with a request class, given whether an app tier already processed it. */
export function action(type: ComponentType, cls: RequestClass, computed: boolean): Action {
  switch (type) {
    case "client":
    case "lb":
      return PASS;
    case "gateway":
      return cls === "abuse" ? { kind: "block" } : PASS;
    case "cdn":
      return cls === "static" ? serve(CDN_HIT) : PASS;
    case "app":
      return cls === "static" ? serve(1) : PASS;
    case "ws":
      return cls === "loc" || cls === "message" ? PASS : REJECT;
    case "cache":
      if (!computed) return REJECT;
      return cls === "read" || cls === "abuse" ? serve(CACHE_HIT) : PASS;
    case "sqldb":
    case "nosql":
      return computed && DB_CLASSES.includes(cls) ? serve(1) : REJECT;
    case "replica":
      return computed && (cls === "read" || cls === "nearby" || cls === "abuse") ? serve(1) : REJECT;
    case "queue":
      return computed && (cls === "write" || cls === "loc" || cls === "message") ? { kind: "queue" } : REJECT;
    case "worker":
      return REJECT;
    case "blob":
      if (cls === "static") return serve(1);
      return cls === "upload" && computed ? serve(1) : REJECT;
    case "geo":
      return computed && (cls === "loc" || cls === "nearby") ? serve(1) : REJECT;
  }
}

function setsCompute(type: ComponentType, cls: RequestClass): boolean {
  return type === "app" || type === "worker" || (type === "ws" && (cls === "loc" || cls === "message"));
}

export function curveAt(curve: Curve, t: number, ticks: number): number {
  const x = ticks <= 1 ? 1 : t / (ticks - 1);
  switch (curve) {
    case "steady":
      return 1;
    case "ramp":
      return 0.25 + 0.75 * x;
    case "spike":
      return t >= Math.floor(ticks * 0.45) && t < Math.floor(ticks * 0.6) ? 1 : 0.4;
    case "wave":
      return 0.55 + 0.45 * Math.sin(Math.PI * x);
  }
}

export function designCredits(design: Design): number {
  return design.nodes.reduce((sum, n) => sum + COMPONENTS[n.type].cost * n.instances, 0);
}

export interface ValidationOptions {
  palette?: ComponentType[];
  budget?: number;
}

/** Rejects designs the UI should never produce; the server runs this before trusting a submission. */
export function validateDesign(design: Design, opts: ValidationOptions = {}): string[] {
  const errors: string[] = [];
  if (!Array.isArray(design?.nodes) || !Array.isArray(design?.edges)) return ["Design must have nodes and edges."];
  if (design.nodes.length > 60) errors.push("Too many components (max 60).");
  if (design.edges.length > 200) errors.push("Too many connections (max 200).");
  const ids = new Set<string>();
  let clients = 0;
  for (const n of design.nodes) {
    if (typeof n.id !== "string" || !n.id || ids.has(n.id)) errors.push(`Invalid or duplicate component id "${n.id}".`);
    ids.add(n.id);
    const spec = COMPONENTS[n.type];
    if (!spec) {
      errors.push(`Unknown component type "${n.type}".`);
      continue;
    }
    if (n.type === "client") clients++;
    else if (opts.palette && !opts.palette.includes(n.type)) errors.push(`${spec.label} is not available in this level.`);
    if (!Number.isInteger(n.instances) || n.instances < 1 || n.instances > spec.maxInstances)
      errors.push(`${spec.label} must have between 1 and ${spec.maxInstances} instances.`);
  }
  if (clients !== 1) errors.push("A design needs exactly one Users node.");
  for (const e of design.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) errors.push("A connection points to a missing component.");
    else if (e.from === e.to) errors.push("A component cannot connect to itself.");
  }
  if (opts.budget !== undefined && designCredits(design) > opts.budget)
    errors.push(`Design costs ${designCredits(design)} credits; the budget is ${opts.budget}.`);
  return errors;
}

function percentile(samples: { v: number; w: number }[], q: number): number {
  const total = samples.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return 0;
  const sorted = [...samples].sort((a, b) => a.v - b.v);
  let acc = 0;
  for (const s of sorted) {
    acc += s.w;
    if (acc >= q * total) return s.v;
  }
  return sorted[sorted.length - 1].v;
}

class Graph {
  readonly byId = new Map<string, DesignNode>();
  readonly out = new Map<string, string[]>();

  constructor(design: Design) {
    for (const n of design.nodes) {
      this.byId.set(n.id, n);
      this.out.set(n.id, []);
    }
    const seen = new Set<string>();
    for (const e of design.edges) {
      const key = `${e.from}>${e.to}`;
      if (seen.has(key) || !this.byId.has(e.from) || !this.byId.has(e.to) || e.from === e.to) continue;
      seen.add(key);
      this.out.get(e.from)!.push(e.to);
    }
  }

  type(id: string): ComponentType {
    return this.byId.get(id)!.type;
  }
}

function enumeratePaths(
  g: Graph,
  cls: RequestClass,
  isUp: (id: string) => boolean,
  start: { id: string; computed: boolean; prob: number; trail: string[] }[],
): Path[] {
  const memo = new Map<string, boolean>();
  const visiting = new Set<string>();

  const canComplete = (id: string, computed: boolean): boolean => {
    const key = `${id}|${computed}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    if (visiting.has(key)) return false;
    visiting.add(key);
    const type = g.type(id);
    const a = action(type, cls, computed);
    const next = computed || setsCompute(type, cls);
    let ok: boolean;
    if (a.kind === "reject") ok = false;
    else if (a.kind === "block" || a.kind === "queue" || (a.kind === "serve" && a.hit >= 1)) ok = true;
    else ok = g.out.get(id)!.some((m) => isUp(m) && canComplete(m, next));
    visiting.delete(key);
    memo.set(key, ok);
    return ok;
  };

  const isPartial = (id: string, computed: boolean) => {
    const a = action(g.type(id), cls, computed);
    return a.kind === "serve" && a.hit < 1;
  };

  // Picks next hops: specialised components first (cache for reads, CDN for static...), equal split among them.
  // A cache or CDN with nothing behind it still works "cache-aside": its misses fall back to the parent's other hops.
  const choose = (id: string, computed: boolean, nodes: string[]) => {
    const cands = g.out.get(id)!.filter((m) => isUp(m) && !nodes.includes(m));
    const eligible = cands.filter((m) => canComplete(m, computed));
    const solid = eligible.filter((m) => !isPartial(m, computed));
    const pool = [...new Set([...eligible, ...cands.filter((m) => isPartial(m, computed) && solid.length > 0)])];
    const prefs = PREFER[cls] ?? [];
    const preferred = (list: string[], from: number) => {
      for (let i = from; i < prefs.length; i++) {
        const hit = list.filter((m) => g.type(m) === prefs[i]);
        if (hit.length > 0) return { hit, index: i };
      }
      return { hit: list, index: prefs.length };
    };
    const first = preferred(pool, 0);
    const rest = solid.filter((m) => !first.hit.includes(m));
    return { hops: first.hit, fallback: preferred(rest, first.index + 1).hit };
  };

  const paths: Path[] = [];
  const walk = (id: string, prob: number, computed: boolean, trail: string[], fallback: string[]) => {
    const nodes = [...trail, id];
    if (paths.length >= MAX_PATHS) {
      paths.push({ prob, nodes, end: "dead" });
      return;
    }
    const type = g.type(id);
    const a = action(type, cls, computed);
    const next = computed || setsCompute(type, cls);
    if (a.kind === "reject") return void paths.push({ prob, nodes, end: "dead" });
    if (a.kind === "block") return void paths.push({ prob, nodes, end: "blocked" });
    if (a.kind === "queue") return void paths.push({ prob, nodes, end: "queued" });
    let rest = prob;
    if (a.kind === "serve") {
      paths.push({ prob: prob * a.hit, nodes, end: "served" });
      rest = prob * (1 - a.hit);
      if (rest <= 1e-12) return;
    }
    const picked = choose(id, next, nodes);
    let hops = picked.hops;
    if (hops.length === 0) hops = fallback.filter((m) => !nodes.includes(m));
    if (hops.length === 0) return void paths.push({ prob: rest, nodes, end: "dead" });
    for (const m of hops) walk(m, rest / hops.length, next, nodes, isPartial(m, next) ? picked.fallback : []);
  };

  for (const s of start) walk(s.id, s.prob, s.computed, s.trail, []);
  return paths;
}

const PREFER: Partial<Record<RequestClass, ComponentType[]>> = {
  read: ["cache", "replica"],
  abuse: ["cache", "replica"],
  static: ["cdn"],
  loc: ["geo", "ws", "queue"],
  nearby: ["geo"],
  write: ["queue"],
  message: ["ws", "queue"],
};

const TERMINALS: Record<RequestClass, ComponentType[]> = {
  read: ["sqldb", "replica", "nosql"],
  write: ["sqldb", "nosql", "queue"],
  static: ["cdn", "blob", "app"],
  upload: ["blob"],
  loc: ["geo", "nosql", "sqldb", "queue"],
  nearby: ["geo", "sqldb", "replica", "nosql"],
  message: ["nosql", "sqldb", "queue"],
  abuse: ["gateway", "sqldb", "replica", "nosql"],
};

function deadEndReason(g: Graph, cls: RequestClass): string {
  const types = new Set([...g.byId.values()].map((n) => n.type));
  const label = CLASS_LABELS[cls];
  const terminals = TERMINALS[cls].filter((t) => types.has(t));
  if (terminals.length === 0)
    return `${label} had nowhere to go. Add a ${TERMINALS[cls].map((t) => COMPONENTS[t].label).join(" or ")} to handle them.`;
  if (cls !== "static" && !types.has("app") && !(types.has("ws") && (cls === "loc" || cls === "message")))
    return `${label} must pass through an App Server before reaching data stores; users never talk to databases directly.`;
  return `Some ${label.toLowerCase()} reached a dead end. Check that every path from Users leads through an App Server to a ${terminals.map((t) => COMPONENTS[t].label).join(" or ")}.`;
}

export function simulate(design: Design, scenario: Scenario): SimResult {
  const g = new Graph(design);
  const ticks = scenario.ticks ?? DEFAULT_TICKS;
  const failures = scenario.failures ?? [];
  const classes = (Object.keys(scenario.traffic) as RequestClass[]).filter((c) => (scenario.traffic[c] ?? 0) > 0);
  const client = design.nodes.find((n) => n.type === "client");
  const idsByType = (type: ComponentType) =>
    [...g.byId.values()].filter((n) => n.type === type).map((n) => n.id).sort();
  // Server pools reached straight from Users or a CDN have no load balancer: traffic lands on one instance.
  const unbalanced = new Set<string>();
  for (const n of design.nodes) {
    if ((n.type !== "app" && n.type !== "ws") || n.instances < 2) continue;
    const inbound = [...g.out.entries()].filter(([, outs]) => outs.includes(n.id)).map(([from]) => g.type(from));
    if (inbound.some((t) => t === "client" || t === "cdn")) unbalanced.add(n.id);
  }

  const backlog = new Map<string, Map<RequestClass, number>>();
  const pathCache = new Map<string, Path[]>();
  const tickResults: TickResult[] = [];
  const allSamples: { v: number; w: number }[] = [];
  const peakUtil: Record<string, { u: number; t: number }> = {};
  const totalLoad = new Map<string, number>();
  const deadByClass = new Map<RequestClass, number>();
  const offeredByClass = new Map<RequestClass, number>();
  let abuseReachedApp = false;
  let queueRejected = 0;
  let workerDeadEnd = false;
  let sumOffered = 0;
  let sumOk = 0;
  let failOffered = 0;
  let failOk = 0;
  let maxLag = 0;
  const outageTicks: { t: number; type: ComponentType; availability: number }[] = [];

  for (let t = 0; t < ticks; t++) {
    const mult = curveAt(scenario.curve, t, ticks);
    const up = new Map<string, number>();
    for (const n of design.nodes) up.set(n.id, n.instances);
    const active = failures.filter((f) => t >= f.at && t < f.at + f.duration);
    for (const f of active) {
      const target = idsByType(f.type)[0];
      if (target) up.set(target, Math.max(0, up.get(target)! - f.count));
    }
    const isUp = (id: string) => (up.get(id) ?? 0) > 0;
    const down = [...up.entries()].filter(([, v]) => v === 0).map(([k]) => k).sort();
    const upKey = down.join(",");

    const pathsFor = (cls: RequestClass): Path[] => {
      const key = `${upKey}|${cls}`;
      let p = pathCache.get(key);
      if (!p) {
        p = client ? enumeratePaths(g, cls, isUp, [{ id: client.id, computed: false, prob: 1, trail: [] }]) : [];
        pathCache.set(key, p);
      }
      return p;
    };

    const load = new Map<string, number>();
    const addLoad = (id: string, v: number) => load.set(id, (load.get(id) ?? 0) + v);
    const enq = new Map<string, Map<RequestClass, number>>();

    for (const cls of classes) {
      const rps = (scenario.traffic[cls] ?? 0) * mult;
      for (const p of pathsFor(cls)) {
        for (const id of p.nodes) if (id !== client?.id) addLoad(id, rps * p.prob * weight(g.type(id), cls));
        if (p.end === "queued") {
          const q = p.nodes[p.nodes.length - 1];
          const m = enq.get(q) ?? new Map();
          m.set(cls, (m.get(cls) ?? 0) + rps * p.prob);
          enq.set(q, m);
        }
        if (cls === "abuse" && p.nodes.some((id) => g.type(id) === "app")) abuseReachedApp = true;
      }
    }

    // Background work: workers drain queues into the stores behind them.
    interface Drain {
      queue: string;
      cls: RequestClass;
      amount: number;
      paths: Path[];
      pending: number;
    }
    const drains: Drain[] = [];
    for (const q of idsByType("queue")) {
      if (!isUp(q)) continue;
      const pending = new Map<RequestClass, number>();
      for (const [cls, v] of backlog.get(q) ?? []) pending.set(cls, v);
      for (const [cls, v] of enq.get(q) ?? []) pending.set(cls, (pending.get(cls) ?? 0) + v);
      const totalPending = [...pending.values()].reduce((a, b) => a + b, 0);
      const workers = g.out.get(q)!.filter((m) => g.type(m) === "worker" && isUp(m));
      const cap = workers.reduce((s, w) => s + up.get(w)! * COMPONENTS.worker.capacity, 0);
      const drainTotal = Math.min(totalPending, cap);
      const instTotal = workers.reduce((s, w) => s + up.get(w)!, 0);
      for (const [cls, pend] of pending) {
        const amount = totalPending > 0 ? (pend * drainTotal) / totalPending : 0;
        const paths: Path[] = [];
        for (const w of workers) {
          const share = up.get(w)! / instTotal;
          addLoad(w, amount * share);
          const hops = g.out.get(w)!.filter((m) => isUp(m) && g.type(m) !== "queue");
          const sub = enumeratePaths(
            g,
            cls,
            isUp,
            hops.map((m) => ({ id: m, computed: true, prob: share / Math.max(1, hops.length), trail: [w] })),
          ).map((p) => (p.end === "queued" ? { ...p, end: "served" as const } : p));
          if (hops.length === 0) sub.push({ prob: share, nodes: [w], end: "dead" });
          paths.push(...sub);
        }
        for (const p of paths)
          for (const id of p.nodes) if (g.type(id) !== "worker") addLoad(id, amount * p.prob * weight(g.type(id), cls));
        drains.push({ queue: q, cls, amount, paths, pending: pend });
      }
    }

    const util: Record<string, number> = {};
    for (const n of design.nodes) {
      if (n.type === "client") continue;
      const spec = COMPONENTS[n.type];
      const instUp = up.get(n.id)!;
      let capInst = spec.standby ? (instUp > 0 ? 1 : 0) : instUp;
      if (unbalanced.has(n.id)) capInst = Math.min(capInst, 1);
      const l = load.get(n.id) ?? 0;
      util[n.id] = capInst > 0 ? l / (spec.capacity * capInst) : l > 0 ? Infinity : 0;
      totalLoad.set(n.id, (totalLoad.get(n.id) ?? 0) + l);
      const u = util[n.id];
      if (!peakUtil[n.id] || u > peakUtil[n.id].u) peakUtil[n.id] = { u, t };
    }
    const okAt = (id: string) => {
      if (g.type(id) === "client") return 1;
      const u = util[id];
      if (!isUp(id)) return 0;
      return u > 1 ? 1 / u : 1;
    };
    const latAt = (id: string) => {
      const type = g.type(id);
      if (type === "client") return 0;
      const u = util[id];
      const factor = u >= 1 ? MAX_FACTOR : Math.min(MAX_FACTOR, 1 / (1 - u));
      return COMPONENTS[type].baseMs * factor;
    };

    let offered = 0;
    let succeeded = 0;
    let failed = 0;
    let blocked = 0;
    const samples: { v: number; w: number }[] = [];
    const queueAccepts = (q: string) => {
      const total = [...(backlog.get(q)?.values() ?? [])].reduce((a, b) => a + b, 0);
      return total >= QUEUE_MAX_BACKLOG ? 0 : 1;
    };
    for (const cls of classes) {
      const rps = (scenario.traffic[cls] ?? 0) * mult;
      const legit = cls !== "abuse";
      if (legit) {
        offered += rps;
        offeredByClass.set(cls, (offeredByClass.get(cls) ?? 0) + rps);
      }
      for (const p of pathsFor(cls)) {
        const flow = rps * p.prob;
        if (p.end === "blocked") {
          blocked += flow;
          continue;
        }
        if (p.end === "dead") {
          if (legit) {
            failed += flow;
            deadByClass.set(cls, (deadByClass.get(cls) ?? 0) + flow);
          }
          continue;
        }
        let ok = p.nodes.reduce((acc, id) => acc * okAt(id), 1);
        if (p.end === "queued") {
          const accept = queueAccepts(p.nodes[p.nodes.length - 1]);
          if (accept === 0 && legit) queueRejected += flow * ok;
          ok *= accept;
        }
        if (!legit) continue;
        const lat = p.nodes.reduce((acc, id) => acc + latAt(id), 0);
        succeeded += flow * ok;
        failed += flow * (1 - ok);
        samples.push({ v: lat, w: flow * ok });
      }
    }

    // Apply drains after this tick's database health is known; unprocessed work stays queued.
    let drainedTotal = 0;
    for (const d of drains) {
      const okFrac = d.paths.reduce(
        (acc, p) => acc + (p.end === "dead" ? 0 : p.prob * p.nodes.reduce((a, id) => a * okAt(id), 1)),
        0,
      );
      if (d.amount > 0 && d.paths.some((p) => p.end === "dead")) workerDeadEnd = true;
      const done = d.amount * okFrac;
      drainedTotal += done;
      const m = backlog.get(d.queue) ?? new Map<RequestClass, number>();
      m.set(d.cls, Math.max(0, d.pending - done));
      backlog.set(d.queue, m);
    }
    // Queues with no drains this tick (no pending) still need their enqueued work recorded.
    for (const [q, m] of enq) {
      if (!backlog.has(q)) backlog.set(q, new Map(m));
    }
    const backlogTotal = [...backlog.values()].reduce((s, m) => s + [...m.values()].reduce((a, b) => a + b, 0), 0);
    const lagSec = backlogTotal <= 1 ? 0 : drainedTotal > 0 ? backlogTotal / drainedTotal : 9_999;
    maxLag = Math.max(maxLag, lagSec);

    const p95 = percentile(samples, 0.95);
    allSamples.push(...samples);
    sumOffered += offered;
    sumOk += succeeded;
    if (active.length > 0) {
      failOffered += offered;
      failOk += succeeded;
      outageTicks.push({ t, type: active[0].type, availability: offered > 0 ? succeeded / offered : 1 });
    }

    const loadRec: Record<string, number> = {};
    for (const [k, v] of load) loadRec[k] = v;
    tickResults.push({ t, offered, succeeded, failed, blocked, p95, util, load: loadRec, backlog: backlogTotal, lagSec, down });
  }

  const result: SimResult = {
    ticks: tickResults,
    availability: sumOffered > 0 ? sumOk / sumOffered : 1,
    p95: percentile(allSamples, 0.95),
    credits: designCredits(design),
    maxLagSec: maxLag,
    failureAvailability: failOffered > 0 ? failOk / failOffered : 1,
    peakUtil,
    issues: [],
  };
  result.issues = diagnose(g, design, result, {
    unbalanced,
    deadByClass,
    offeredByClass,
    abuseReachedApp,
    queueRejected,
    workerDeadEnd,
    outageTicks,
    totalLoad,
  });
  return result;
}

interface DiagnoseInput {
  unbalanced: Set<string>;
  deadByClass: Map<RequestClass, number>;
  offeredByClass: Map<RequestClass, number>;
  abuseReachedApp: boolean;
  queueRejected: number;
  workerDeadEnd: boolean;
  outageTicks: { t: number; type: ComponentType; availability: number }[];
  totalLoad: Map<string, number>;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

function diagnose(g: Graph, design: Design, r: SimResult, d: DiagnoseInput): Issue[] {
  const issues: Issue[] = [];
  const name = (id: string) => COMPONENTS[g.type(id)].label;

  for (const [cls, dead] of d.deadByClass) {
    const offered = d.offeredByClass.get(cls) ?? 0;
    if (offered > 0 && dead / offered > 0.01)
      issues.push({ kind: "dead-end", requestClass: cls, severity: "high", message: `${pct(dead / offered)} of ${CLASS_LABELS[cls].toLowerCase()} failed. ${deadEndReason(g, cls)}` });
  }

  for (const id of d.unbalanced)
    issues.push({ kind: "overload", nodeId: id, severity: "high", message: `${name(id)} has ${g.byId.get(id)!.instances} instances but nothing spreads traffic across them, so users only reach one. Put a Load Balancer in front.` });

  const outage = d.outageTicks.filter((o) => o.availability < 0.99);
  if (outage.length > 0) {
    const worst = outage.reduce((a, b) => (b.availability < a.availability ? b : a));
    issues.push({
      kind: "outage",
      severity: "high",
      message: `When a ${COMPONENTS[worst.type].label} instance failed (from second ${outage[0].t}), only ${pct(worst.availability)} of requests succeeded. Add a second instance or another node behind a load balancer so one failure is survivable.`,
    });
  }

  for (const [id, peak] of Object.entries(r.peakUtil)) {
    if (!Number.isFinite(peak.u)) continue;
    const node = g.byId.get(id)!;
    const spec = COMPONENTS[node.type];
    if (peak.u > 1) {
      const fix =
        node.type === "sqldb"
          ? "Move reads to a cache or read replicas, move writes to a queue, or switch to sharded NoSQL."
          : node.type === "app"
            ? "Add instances behind the load balancer, or let a cache/CDN answer requests before they reach it."
            : `Add instances (max ${spec.maxInstances}) or offload work before it reaches it.`;
      issues.push({ kind: "overload", nodeId: id, severity: "high", message: `${name(id)} hit ${pct(peak.u)} of capacity at second ${peak.t}, so requests were dropped. ${fix}` });
    } else if (peak.u > 0.85) {
      issues.push({ kind: "overload", nodeId: id, severity: "medium", message: `${name(id)} ran at ${pct(peak.u)} of capacity at second ${peak.t}. Queueing delay rises sharply above about 70%, which hurts p95 latency.` });
    }
  }

  if (r.maxLagSec > 10)
    issues.push({
      kind: "backlog",
      severity: r.maxLagSec > 60 ? "high" : "medium",
      message: d.workerDeadEnd
        ? "Workers had no database to write to, so queued jobs piled up. Connect each Worker to a store that accepts writes."
        : `Queued work fell up to ${r.maxLagSec >= 9_999 ? "forever" : `${Math.round(r.maxLagSec)} seconds`} behind. ${r.maxLagSec >= 9_999 ? "Connect Workers to the queue so jobs get processed." : "Add Workers (or make the database behind them faster)."}`,
    });

  if (d.queueRejected > 0)
    issues.push({ kind: "queue-full", severity: "high", message: "The queue filled up and started rejecting work. Add workers so it drains faster than it fills." });

  if (d.abuseReachedApp)
    issues.push({ kind: "abuse", severity: "medium", message: "Bot traffic reached your App Servers and used capacity meant for real users. Put an API Gateway with rate limiting in front." });

  for (const n of design.nodes) {
    if (n.type === "client") continue;
    if ((d.totalLoad.get(n.id) ?? 0) === 0)
      issues.push({ kind: "idle", nodeId: n.id, severity: "low", message: `${name(n.id)} never received traffic: ${COMPONENTS[n.type].cost * n.instances} credits wasted. Connect it or remove it.` });
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}
