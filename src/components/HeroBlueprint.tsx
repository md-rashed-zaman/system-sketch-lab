import type { ComponentType } from "@/engine/types";
import { ICONS, TINT } from "./play/icons";

const W = 116;
const H = 54;

/** A component card drawn in SVG: tinted icon tile, name, a mono metric and a load bar. */
function Card({ x, y, type, label, metric, load, hot }: { x: number; y: number; type: ComponentType; label: string; metric: string; load: number; hot?: boolean }) {
  const Icon = ICONS[type];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={W} height={H} rx={14} style={{ fill: "var(--card)", stroke: "var(--line)" }} />
      <rect x={9} y={9} width={30} height={30} rx={9} style={{ fill: TINT[type], fillOpacity: 0.16 }} />
      <Icon x={15} y={15} width={18} height={18} style={{ color: TINT[type] }} />
      <text x={47} y={23} style={{ fill: "var(--ink)", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-geist)" }}>
        {label}
      </text>
      <text x={47} y={37} style={{ fill: "var(--ink-soft)", fontSize: 10.5, fontFamily: "var(--font-geist-mono)" }}>
        {metric}
      </text>
      <rect x={9} y={H - 8} width={W - 18} height={3} rx={1.5} style={{ fill: "var(--line)" }} />
      <rect x={9} y={H - 8} height={3} rx={1.5} style={{ fill: hot ? "#ef4444" : load > 0.7 ? "#f59e0b" : "#22c55e" }} width={(W - 18) * load}>
        {hot ? (
          <animate attributeName="width" values={`${(W - 18) * 0.55};${W - 18};${W - 18};${(W - 18) * 0.55}`} keyTimes="0;0.3;0.7;1" dur="5s" repeatCount="indefinite" />
        ) : (
          <animate attributeName="width" values={`${(W - 18) * load};${(W - 18) * Math.min(1, load + 0.12)};${(W - 18) * load}`} dur="3.2s" repeatCount="indefinite" />
        )}
      </rect>
    </g>
  );
}

function Flow({ d, n = 3, dur = 2.2, color = "var(--signal)", r = 3.2, delay = 0 }: { d: string; n?: number; dur?: number; color?: string; r?: number; delay?: number }) {
  return (
    <>
      <path d={d} style={{ fill: "none", stroke: "var(--edge)", strokeWidth: 1.4, strokeOpacity: 0.7 }} />
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} r={r} style={{ fill: color }}>
          <animateMotion path={d} dur={`${dur}s`} begin={`${-(delay + (i * dur) / n)}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  );
}

/** Animated hero architecture with hand-written annotations. Pure SVG/SMIL, theme-aware, no JavaScript. */
export function HeroBlueprint() {
  return (
    <svg viewBox="0 0 640 340" className="h-auto w-full" role="img" aria-label="Animated architecture: users, a CDN, a load balancer, three app servers, a cache and an overloaded database, with traffic flowing between them">
      {/* wires and traffic sit under the cards */}
      <Flow d="M126,181 L172,181" n={4} dur={1.6} />
      <Flow d="M126,172 C150,172 150,67 172,67" n={2} dur={2} color="#38bdf8" />
      <Flow d="M288,181 C312,181 312,97 336,97" n={2} dur={1.8} />
      <Flow d="M288,181 L336,181" n={2} dur={1.8} delay={0.3} />
      <Flow d="M288,181 C312,181 312,265 336,265" n={2} dur={1.8} delay={0.6} />
      <Flow d="M452,97 C474,97 474,139 498,139" n={2} dur={1.6} color="#22c55e" />
      <Flow d="M452,181 C474,181 474,139 498,139" n={2} dur={1.6} color="#22c55e" delay={0.4} />
      <Flow d="M452,265 C474,265 474,139 498,139" n={2} dur={1.6} color="#22c55e" delay={0.8} />
      <Flow d="M556,166 L556,216" n={2} dur={1.2} color="#ef4444" />

      <Card x={10} y={154} type="client" label="Users" metric="18.4k/s" load={0.4} />
      <Card x={172} y={40} type="cdn" label="CDN" metric="90% edge" load={0.3} />
      <Card x={172} y={154} type="lb" label="Load Bal." metric="×2 healthy" load={0.25} />
      <Card x={336} y={70} type="app" label="App" metric="62% busy" load={0.62} />
      <Card x={336} y={154} type="app" label="App" metric="64% busy" load={0.64} />
      <Card x={336} y={238} type="app" label="App" metric="61% busy" load={0.61} />
      <Card x={498} y={112} type="cache" label="Cache" metric="80% hit" load={0.45} />
      <Card x={498} y={216} type="sqldb" label="Database" metric="writes ×4" load={0.55} hot />

      {/* overload pulse on the database */}
      <rect x={498} y={216} width={W} height={H} rx={14} style={{ fill: "none", stroke: "#ef4444", strokeWidth: 2 }}>
        <animate attributeName="stroke-opacity" values="0;0.9;0" dur="5s" repeatCount="indefinite" />
      </rect>

      {/* marker annotations */}
      <g style={{ fill: "none", stroke: "var(--signal)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
        <path className="draw" style={{ ["--len" as string]: 120 }} d="M470,318 C500,326 540,320 548,276" />
        <path className="draw" style={{ ["--len" as string]: 30 }} d="M541,284 L548,274 L556,283" />
        <path className="draw" style={{ ["--len" as string]: 110 }} d="M588,40 C618,56 620,86 596,106" />
        <path className="draw" style={{ ["--len" as string]: 30 }} d="M598,95 L594,108 L607,106" />
      </g>
      <text x={350} y={326} className="marker" style={{ fill: "var(--signal)", fontSize: 22 }}>
        bottleneck!
      </text>
      <text x={404} y={30} className="marker" style={{ fill: "var(--signal)", fontSize: 19 }}>
        80% never reach the DB
      </text>
    </svg>
  );
}
