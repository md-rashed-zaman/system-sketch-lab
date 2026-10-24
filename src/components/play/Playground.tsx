"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type IsValidConnection,
} from "@xyflow/react";
import clsx from "clsx";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  FastForward,
  Gauge,
  Inbox,
  MousePointerClick,
  Play,
  RotateCcw,
  ShieldCheck,
  Spline,
  Square,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import type { Level } from "@/content/types";
import { COMPONENTS } from "@/engine/components";
import { CLIENT_ID } from "@/engine/design";
import { evaluate, type Evaluation } from "@/engine/scoring";
import { designCredits, simulate } from "@/engine/simulate";
import type { ComponentType, Design, Scenario, SimResult } from "@/engine/types";
import { BriefPanel } from "./BriefPanel";
import { ComponentNode, type ComponentNodeT } from "./ComponentNode";
import { ICONS, TINT, utilColor } from "./icons";
import { Inspector } from "./Inspector";
import { ResultsPanel, type ServerOutcome } from "./ResultsPanel";

const nodeTypes = { component: ComponentNode };
const TICK_MS = 120;

export interface PlaygroundProps {
  level: Level;
  initialDesign: Design;
  signedIn: boolean;
  bestStars: number;
  backHref: string;
  backLabel: string;
  nextHref?: string;
  /** Sandbox: no budget pressure, editable traffic, nothing saved. */
  sandbox?: boolean;
  shareUrl?: string;
}

const toFlowNodes = (d: Design): ComponentNodeT[] =>
  d.nodes.map((n) => ({
    id: n.id,
    type: "component",
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    deletable: n.type !== "client",
    data: { type: n.type, instances: n.instances },
  }));

const EDGE = "var(--edge)";
const edgeStyle = { stroke: EDGE, strokeWidth: 1.75 };
const toFlowEdges = (d: Design): Edge[] =>
  d.edges.map((e) => ({ id: `${e.from}->${e.to}`, source: e.from, target: e.to, markerEnd: { type: MarkerType.ArrowClosed, color: EDGE }, style: edgeStyle }));

const toDesign = (nodes: ComponentNodeT[], edges: Edge[]): Design => ({
  nodes: nodes.map((n) => ({ id: n.id, type: n.data.type, instances: n.data.instances, x: Math.round(n.position.x), y: Math.round(n.position.y) })),
  edges: edges.map((e) => ({ from: e.source, to: e.target })),
});

const draftKey = (id: string) => `sf:draft:${id}`;

function loadDraft(level: Level): Design | null {
  try {
    const raw = localStorage.getItem(draftKey(level.id));
    if (!raw) return null;
    const d = JSON.parse(raw) as Design;
    const ok = d.nodes.every((n) => n.type === "client" || level.palette.includes(n.type)) && d.nodes.some((n) => n.id === CLIENT_ID);
    return ok ? d : null;
  } catch {
    return null;
  }
}

export function Playground(props: PlaygroundProps) {
  return (
    <ReactFlowProvider>
      <PlaygroundInner {...props} />
    </ReactFlowProvider>
  );
}

function PlaygroundInner({ level, initialDesign, signedIn, bestStars, backHref, backLabel, nextHref, sandbox, shareUrl }: PlaygroundProps) {
  const router = useRouter();
  // Rendered client-only (see PlaygroundClient), so a local draft can seed the initial state directly.
  // The starting design as the canvas would save it, so an untouched design never counts as a draft.
  const [baseline] = useState(() => JSON.stringify(toDesign(toFlowNodes(initialDesign), toFlowEdges(initialDesign))));
  const [draft] = useState(() => {
    const d = loadDraft(level);
    return d && JSON.stringify(d) !== baseline ? d : null;
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<ComponentNodeT>(toFlowNodes(draft ?? initialDesign));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(draft ?? initialDesign));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"build" | "running" | "done">("build");
  const [sim, setSim] = useState<SimResult | null>(null);
  const [tick, setTick] = useState(0);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [outcome, setOutcome] = useState<ServerOutcome | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario>(level.scenario);
  const [restored, setRestored] = useState(draft !== null);
  const flow = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // The timer and "Skip to results" can both finish a run before React re-renders; submit it once.
  const finished = useRef(false);

  const design = useMemo(() => toDesign(nodes, edges), [nodes, edges]);
  const credits = designCredits(design);
  const budget = sandbox ? Infinity : level.budget;
  const overBudget = credits > budget;

  useEffect(() => {
    if (phase !== "build") return;
    const id = setTimeout(() => {
      try {
        const json = JSON.stringify(design);
        if (json === baseline) localStorage.removeItem(draftKey(level.id));
        else localStorage.setItem(draftKey(level.id), json);
      } catch {
        // Private mode or full storage: drafts are a convenience only.
      }
    }, 300);
    return () => clearTimeout(id);
  }, [design, level.id, phase, baseline]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const wouldExceed = useCallback(
    (extra: number) => {
      if (credits + extra <= budget) return false;
      setToast(`Over budget: that would cost ${credits + extra} of ${level.budget} credits.`);
      return true;
    },
    [credits, budget, level.budget],
  );

  const addComponent = useCallback(
    (type: ComponentType, position?: { x: number; y: number }) => {
      if (phase !== "build" || wouldExceed(COMPONENTS[type].cost)) return;
      const id = `${type}-${Math.random().toString(36).slice(2, 7)}`;
      let pos = position;
      if (!pos) {
        // Clicked from the palette: place right of the rightmost component, below anything already there.
        const rightmost = nodes.reduce((a, b) => (b.position.x > a.position.x ? b : a), nodes[0]);
        pos = { x: (rightmost?.position.x ?? 0) + 230, y: rightmost?.position.y ?? 60 };
        while (nodes.some((n) => Math.abs(n.position.x - pos!.x) < 170 && Math.abs(n.position.y - pos!.y) < 100)) pos.y += 120;
        setTimeout(() => void flow.fitView({ padding: 0.15, maxZoom: 1.1, duration: 250 }), 30);
      }
      setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { id, type: "component", position: pos!, selected: true, data: { type, instances: 1 } }]);
      setSelectedId(id);
    },
    [phase, wouldExceed, flow, nodes, setNodes],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/x-system-sketch-lab") as ComponentType;
      if (!type || !COMPONENTS[type]) return;
      const p = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addComponent(type, { x: p.x - 84, y: p.y - 28 });
    },
    [flow, addComponent],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (c) => {
      if (c.source === c.target) return false;
      const target = nodes.find((n) => n.id === c.target);
      if (!target || target.data.type === "client") return false;
      return !edges.some((e) => e.source === c.source && e.target === c.target);
    },
    [nodes, edges],
  );

  const connect = useCallback(
    (c: Connection) => {
      if (phase !== "build") return;
      setEdges((es) => addEdge({ ...c, id: `${c.source}->${c.target}`, markerEnd: { type: MarkerType.ArrowClosed, color: EDGE }, style: edgeStyle }, es));
    },
    [phase, setEdges],
  );

  const setInstances = useCallback(
    (id: string, instances: number) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      const spec = COMPONENTS[node.data.type];
      const next = Math.max(1, Math.min(spec.maxInstances, instances));
      if (next > node.data.instances && wouldExceed((next - node.data.instances) * spec.cost)) return;
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, instances: next } } : n)));
    },
    [nodes, setNodes, wouldExceed],
  );

  const removeNode = useCallback(
    (id: string) => {
      if (id === CLIENT_ID) return;
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
      setSelectedId(null);
    },
    [setNodes, setEdges],
  );

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      setNodes((ns) => ns.map((n) => (n.selected === (n.id === id) ? n : { ...n, selected: n.id === id })));
    },
    [setNodes],
  );

  const removeEdge = useCallback((source: string, target: string) => setEdges((es) => es.filter((e) => !(e.source === source && e.target === target))), [setEdges]);

  const resetDesign = useCallback(() => {
    setNodes(toFlowNodes(initialDesign));
    setEdges(toFlowEdges(initialDesign));
    setSelectedId(null);
    setRestored(false);
    try {
      localStorage.removeItem(draftKey(level.id));
    } catch {}
  }, [initialDesign, level.id, setNodes, setEdges]);

  // Paint simulation state onto nodes and edges for the current tick.
  useEffect(() => {
    if (!sim || phase === "build") return;
    const t = sim.ticks[Math.min(tick, sim.ticks.length - 1)];
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        data: { ...n.data, running: true, util: n.data.type === "client" ? undefined : t.util[n.id], load: t.load[n.id] ?? 0, down: t.down.includes(n.id) },
      })),
    );
    setEdges((es) =>
      es.map((e) => {
        const load = t.load[e.target] ?? 0;
        const color = load > 0 ? utilColor(t.util[e.target], t.down.includes(e.target)) : EDGE;
        return {
          ...e,
          animated: load > 0,
          style: { stroke: color, strokeWidth: load > 0 ? Math.min(5, 1.5 + Math.log10(1 + load) * 0.8) : 1.5, opacity: load > 0 ? 1 : 0.4 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      }),
    );
  }, [sim, tick, phase, setNodes, setEdges]);

  const clearRunStyles = useCallback(() => {
    setNodes((ns) => ns.map((n) => ({ ...n, data: { type: n.data.type, instances: n.data.instances } })));
    setEdges((es) => es.map((e) => ({ ...e, animated: false, style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: EDGE } })));
  }, [setNodes, setEdges]);

  const finish = useCallback(
    async (result: SimResult) => {
      if (finished.current) return;
      finished.current = true;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      setTick(result.ticks.length - 1);
      setPhase("done");
      const ev = evaluate(level.objectives, level.stretch, result);
      setEvaluation(ev);
      if (!signedIn || sandbox) return;
      setSaving(true);
      try {
        const res = await fetch("/api/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ levelId: level.id, design }) });
        const json = await res.json();
        if (!res.ok) setSaveError(json.details?.join(" ") ?? json.error ?? "Could not save this run.");
        else {
          setOutcome(json as ServerOutcome);
          router.refresh(); // header XP and best stars come from server components
        }
      } catch {
        setSaveError("Network error: your run was not saved.");
      } finally {
        setSaving(false);
      }
    },
    [level, signedIn, sandbox, design, router],
  );

  const run = useCallback(() => {
    if (overBudget) return setToast(`Over budget: ${credits} of ${level.budget} credits. Remove something first.`);
    const result = simulate(design, scenario);
    finished.current = false;
    setSim(result);
    setEvaluation(null);
    setOutcome(null);
    setSaveError(null);
    setSelectedId(null);
    setTick(0);
    setPhase("running");
    let t = 0;
    timer.current = setInterval(() => {
      t++;
      if (t >= result.ticks.length) void finish(result);
      else setTick(t);
    }, TICK_MS);
  }, [overBudget, credits, level.budget, design, scenario, finish]);

  const backToBuild = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPhase("build");
    setSim(null);
    clearRunStyles();
  }, [clearRunStyles]);

  const current = sim?.ticks[Math.min(tick, sim.ticks.length - 1)];
  const sofar = useMemo(() => {
    if (!sim) return null;
    const slice = sim.ticks.slice(0, tick + 1);
    const offered = slice.reduce((s, x) => s + x.offered, 0);
    const ok = slice.reduce((s, x) => s + x.succeeded, 0);
    return offered > 0 ? ok / offered : 1;
  }, [sim, tick]);
  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const failureTicks = useMemo(() => new Set((scenario.failures ?? []).flatMap((f) => Array.from({ length: f.duration }, (_, i) => f.at + i))), [scenario]);

  return (
    <div className="grid grid-cols-1 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[340px_minmax(0,1fr)_300px]" data-testid="playground">
      <BriefPanel level={level} bestStars={bestStars} backHref={backHref} backLabel={backLabel} sandbox={sandbox} scenario={scenario} onScenario={setScenario} restored={restored} />

      <section className="relative flex h-[78vh] min-h-[520px] flex-col border-y border-line lg:h-auto lg:border-x lg:border-y-0">
        {/* Palette */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-line bg-paper px-3 py-2" aria-label="Components">
          {level.palette.map((type) => {
            const spec = COMPONENTS[type];
            return (
              <button
                key={type}
                type="button"
                draggable={phase === "build"}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-system-sketch-lab", type);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => addComponent(type)}
                disabled={phase !== "build"}
                className="group flex shrink-0 items-center gap-2 rounded-xl border border-line bg-card py-1.5 pl-1.5 pr-3 text-xs font-semibold transition hover:border-ink/30 hover:shadow-sm disabled:opacity-50"
                title={`${spec.label}: ${spec.description}`}
                aria-label={`Add ${spec.label}, ${spec.cost} credits`}
                data-testid={`palette-${type}`}
              >
                <PaletteIcon type={type} />
                {spec.short}
                <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-normal text-ink-soft">
                  <CircleDollarSign size={13} />
                  {spec.cost}
                </span>
              </button>
            );
          })}
        </div>

        <div ref={wrapper} className="relative flex-1 bg-canvas" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={connect}
            isValidConnection={isValidConnection}
            onNodeClick={(_, n) => select(n.id)}
            onPaneClick={() => select(null)}
            onBeforeDelete={async ({ nodes: del, edges: delEdges }) => (phase === "build" ? { nodes: del.filter((n) => n.id !== CLIENT_ID), edges: delEdges } : false)}
            nodesDraggable={phase === "build"}
            nodesConnectable={phase === "build"}
            deleteKeyCode={["Delete", "Backspace"]}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1.1 }}
            minZoom={0.3}
            proOptions={{ hideAttribution: false }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} />
            <Controls showInteractive={false} position="bottom-left" />
          </ReactFlow>

          {phase !== "build" && current && (
            <div className="pointer-events-none absolute inset-x-3 top-3 rounded-xl border border-line bg-card/95 px-4 py-3 font-mono text-xs shadow-[var(--shadow)] backdrop-blur" data-testid="live-hud">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <HudStat icon={Timer} label="Simulated time">
                  {current.t + 1}/{sim!.ticks.length}s
                </HudStat>
                <HudStat icon={Activity} label="Traffic per second">
                  {Math.round(current.offered).toLocaleString()}/s
                </HudStat>
                <HudStat icon={ShieldCheck} label="Availability so far" color={(sofar ?? 1) >= level.objectives.minAvailability ? "var(--ok)" : "var(--bad)"}>
                  {((sofar ?? 1) * 100).toFixed(2)}%
                </HudStat>
                <HudStat icon={Gauge} label="p95 latency" color={current.p95 <= level.objectives.maxP95 ? "var(--ok)" : "var(--warn)"}>
                  {Math.round(current.p95)}ms
                </HudStat>
                {current.backlog > 1 && (
                  <HudStat icon={Inbox} label="Queue backlog" color="var(--warn)">
                    {Math.round(current.backlog).toLocaleString()}
                  </HudStat>
                )}
                {current.down.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-bad px-2 py-0.5 font-sans font-semibold text-white">
                    <Zap size={12} /> Failure
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex h-1.5 gap-px overflow-hidden rounded-full">
                {sim!.ticks.map((x) => (
                  <span
                    key={x.t}
                    className="flex-1"
                    style={{ background: x.t <= tick ? (failureTicks.has(x.t) ? "var(--bad)" : "var(--signal)") : failureTicks.has(x.t) ? "color-mix(in oklab, var(--bad) 30%, transparent)" : "var(--line)" }}
                  />
                ))}
              </div>
            </div>
          )}

          {nodes.length === 1 && phase === "build" && (
            <ol className="pointer-events-none absolute inset-x-0 bottom-20 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 text-xs text-ink-soft" aria-label="How to build">
              {(
                [
                  [MousePointerClick, "Add a component"],
                  [Spline, "Drag dot to dot"],
                  [Play, "Run it"],
                ] as const
              ).map(([Icon, text], i) => (
                <li key={text} className="flex items-center gap-3">
                  {i > 0 && <ArrowRight size={14} className="opacity-50" aria-hidden />}
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 shadow-sm">
                    <Icon size={14} className="text-signal" /> {text}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {toast && (
            <div role="status" className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white ink-shadow-sm">
              {toast}
            </div>
          )}
        </div>

        {/* Run bar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-paper px-4 py-3">
          {!sandbox && (
            <div className="min-w-[180px] flex-1" data-testid="budget">
              <div className="flex justify-between font-mono text-xs">
                <span className="inline-flex items-center gap-1.5 text-ink-soft" title="Credits used">
                  <CircleDollarSign size={13} /> Budget
                </span>
                <span className={clsx("tabular font-semibold", overBudget && "text-bad")}>
                  {credits} / {level.budget}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-3">
                <div className={clsx("h-full transition-all", overBudget ? "bg-bad" : credits / level.budget > 0.85 ? "bg-warn" : "bg-ok")} style={{ width: `${Math.min(100, (credits / level.budget) * 100)}%` }} />
              </div>
            </div>
          )}
          {sandbox && (
            <p className="flex flex-1 items-center gap-1.5 font-mono text-xs text-ink-soft">
              <CircleDollarSign size={13} /> {credits} · nothing is saved
            </p>
          )}
          {phase === "build" ? (
            <>
              <button type="button" onClick={resetDesign} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper-2">
                <RotateCcw size={15} /> Reset
              </button>
              <button
                type="button"
                onClick={run}
                disabled={overBudget}
                className="inline-flex items-center gap-2 rounded-lg bg-signal px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
              >
                <Play size={16} className="fill-white" /> Run simulation
              </button>
            </>
          ) : phase === "running" ? (
            <>
              <button type="button" onClick={backToBuild} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-paper-2">
                <Square size={14} /> Stop
              </button>
              <button type="button" onClick={() => sim && void finish(sim)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold hover:bg-paper-2">
                <FastForward size={15} /> Skip to results
              </button>
            </>
          ) : (
            <button type="button" onClick={backToBuild} className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold hover:bg-paper-2">
              <ArrowLeft size={15} /> Back to design
            </button>
          )}
        </div>

        {phase === "done" && evaluation && sim && (
          <ResultsPanel
            level={level}
            evaluation={evaluation}
            sim={sim}
            outcome={outcome}
            saving={saving}
            saveError={saveError}
            signedIn={signedIn}
            sandbox={sandbox}
            nextHref={nextHref}
            shareUrl={shareUrl}
            onEdit={backToBuild}
            onRetry={run}
          />
        )}
      </section>

      <Inspector
        node={selected}
        nodes={nodes}
        edges={edges}
        locked={phase !== "build"}
        onInstances={setInstances}
        onRemove={removeNode}
        onConnect={(source, target) => isValidConnection({ source, target, sourceHandle: null, targetHandle: null }) && connect({ source, target, sourceHandle: null, targetHandle: null })}
        onRemoveEdge={removeEdge}
        palette={level.palette}
      />
    </div>
  );
}

function PaletteIcon({ type }: { type: ComponentType }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, ${TINT[type]} 18%, transparent)`, color: TINT[type] }}>
      <IconFor type={type} />
    </span>
  );
}

function IconFor({ type }: { type: ComponentType }) {
  const Icon = ICONS[type];
  return <Icon size={15} />;
}

function HudStat({ icon: Icon, label, color, children }: { icon: LucideIcon; label: string; color?: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold tabular" style={color ? { color } : undefined} title={label} aria-label={label}>
      <Icon size={14} className={color ? undefined : "text-ink-soft"} />
      {children}
    </span>
  );
}
