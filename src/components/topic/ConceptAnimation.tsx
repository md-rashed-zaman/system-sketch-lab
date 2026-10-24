"use client";

import { Bot, Car, MapPin, Pause, Play, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { COMPONENTS } from "@/engine/components";
import type { ComponentType } from "@/engine/types";
import type { ConceptId } from "@/content/concepts";
import { ICONS, TINT } from "../play/icons";

const C = { card: "var(--card)", line: "var(--line)", ink: "var(--ink)", soft: "var(--ink-soft)", signal: "var(--signal)", cobalt: "var(--cobalt)", ok: "#22c55e", warn: "#f59e0b", bad: "#ef4444" };

function Box({ x, y, type, label, w = 112, h = 44, icon }: { x: number; y: number; type: ComponentType; label?: string; w?: number; h?: number; icon?: LucideIcon }) {
  const Icon = icon ?? ICONS[type];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} style={{ fill: C.card, stroke: C.line }} />
      <Icon x={x + 10} y={y + h / 2 - 9} width={18} height={18} style={{ color: TINT[type] }} />
      <text x={x + 34} y={y + h / 2 + 4} style={{ fill: C.ink, fontSize: 12, fontWeight: 600 }}>
        {label ?? COMPONENTS[type].short}
      </text>
    </g>
  );
}

const Wire = ({ d, dashed }: { d: string; dashed?: boolean }) => (
  <path d={d} style={{ fill: "none", stroke: "var(--edge)", strokeWidth: 1.5, strokeDasharray: dashed ? "4 4" : undefined }} />
);

/** A dot travelling along `d`, already mid-flight on load (negative begin) and looping forever. */
function Packet({ d, dur = 2.4, at = 0, color = C.signal, r = 4.5, children }: { d: string; dur?: number; at?: number; color?: string; r?: number; children?: ReactNode }) {
  return (
    <circle r={r} style={{ fill: color }}>
      <animateMotion path={d} dur={`${dur}s`} begin={`${-at}s`} repeatCount="indefinite" />
      {children}
    </circle>
  );
}

const Note = ({ x, y, children, color = C.soft, anchor = "start" }: { x: number; y: number; children: ReactNode; color?: string; anchor?: "start" | "middle" | "end" }) => (
  <text x={x} y={y} textAnchor={anchor} style={{ fill: color, fontSize: 11, fontWeight: 500 }}>
    {children}
  </text>
);

// ---------------------------------------------------------------- concepts

function LoadBalancing() {
  const branches = ["C370,120 370,46 430,46", "L430,120", "C370,120 370,194 430,194"];
  return (
    <>
      <Wire d="M128,120 L200,120" />
      {branches.map((b) => (
        <Wire key={b} d={`M312,120 ${b}`} />
      ))}
      {branches.map((b, i) => (
        <Packet key={b} d={`M128,120 L312,120 ${b}`} at={i * 0.8} />
      ))}
      <Box x={16} y={98} type="client" />
      <Box x={200} y={98} type="lb" />
      {[24, 98, 172].map((y, i) => (
        <Box key={y} x={430} y={y} type="app" label={`App ${i + 1}`} />
      ))}
    </>
  );
}

function CacheAside() {
  const hit = "M128,120 L302,120 C360,120 360,52 420,52 C360,52 360,120 302,120 L128,120";
  const miss = "M128,120 L302,120 C360,120 360,188 420,188 C360,188 360,120 302,120 L128,120";
  return (
    <>
      <Wire d="M128,120 L190,120" />
      <Wire d="M302,120 C360,120 360,52 420,52" />
      <Wire d="M302,120 C360,120 360,188 420,188" />
      {[0, 0.6, 1.2, 1.8].map((at) => (
        <Packet key={at} d={hit} dur={3} at={at} color={C.ok} />
      ))}
      <Packet d={miss} dur={3} at={2.4} color={C.warn} />
      <Box x={16} y={98} type="client" />
      <Box x={190} y={98} type="app" />
      <Box x={420} y={30} type="cache" />
      <Box x={420} y={166} type="sqldb" />
      <Note x={545} y={56} color={C.ok}>
        ~80% hits
      </Note>
      <Note x={545} y={192} color={C.warn}>
        ~20% misses
      </Note>
    </>
  );
}

function EdgeCdn() {
  const ys = [20, 98, 176];
  const toOrigin = ["C410,42 410,120 470,120", "L470,120", "C410,198 410,120 470,120"];
  return (
    <>
      {ys.map((y, i) => (
        <g key={y}>
          <Wire d={`M128,${y + 22} L230,${y + 22}`} />
          <Wire d={`M342,${y + 22} ${toOrigin[i]}`} dashed />
        </g>
      ))}
      {ys.map((y, i) => (
        <Packet key={y} d={`M128,${y + 22} L230,${y + 22} L128,${y + 22}`} dur={2} at={i * 0.5} color={C.ok} />
      ))}
      <Packet d="M128,120 L342,120 L470,120 L342,120 L128,120" dur={4} at={1} color={C.warn} />
      {ys.map((y) => (
        <Box key={`u${y}`} x={16} y={y} type="client" />
      ))}
      {ys.map((y) => (
        <Box key={`e${y}`} x={230} y={y} type="cdn" label="Edge" />
      ))}
      <Box x={470} y={98} type="blob" label="Origin" />
      <Note x={286} y={14} anchor="middle" color={C.ok}>
        served nearby
      </Note>
      <Note x={526} y={160} anchor="middle" color={C.warn}>
        only misses travel here
      </Note>
    </>
  );
}

function Failover() {
  const toA = "M128,120 L302,120 C365,120 365,52 430,52";
  const toB = "M128,120 L302,120 C365,120 365,188 430,188";
  const outage = { values: "0;0;1;1;0;0", keyTimes: "0;0.4;0.45;0.85;0.9;1" };
  return (
    <>
      <Wire d="M128,120 L190,120" />
      <Wire d="M302,120 C365,120 365,52 430,52" />
      <Wire d="M302,120 C365,120 365,188 430,188" />
      {[0, 0.8, 1.6].map((at) => (
        <Packet key={at} d={toA} at={at}>
          <animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes={outage.keyTimes} dur="6s" repeatCount="indefinite" />
        </Packet>
      ))}
      {[0.4, 1.2, 2].map((at) => (
        <Packet key={at} d={toB} at={at} color={C.ok} />
      ))}
      <Box x={16} y={98} type="client" />
      <Box x={190} y={98} type="lb" />
      <Box x={430} y={30} type="app" label="App A" />
      <Box x={430} y={166} type="app" label="App B" />
      <g style={{ opacity: 0 }}>
        <animate attributeName="opacity" {...outage} dur="6s" repeatCount="indefinite" />
        <rect x={430} y={30} width={112} height={44} rx={10} style={{ fill: C.bad, fillOpacity: 0.15, stroke: C.bad }} />
        <Note x={556} y={56} color={C.bad}>
          crashed
        </Note>
      </g>
    </>
  );
}

function Replication() {
  const read = (y: number) => `M152,120 C300,120 300,${y} 460,${y}`;
  return (
    <>
      <Wire d="M152,120 C300,120 300,42 460,42" />
      <Wire d={read(132)} />
      <Wire d={read(202)} />
      <Wire d="M572,42 C612,42 612,132 572,132" dashed />
      <Wire d="M572,42 C630,42 630,202 572,202" dashed />
      <Packet d="M152,120 C300,120 300,42 460,42" dur={2.6} />
      <Packet d={read(132)} dur={2.2} at={0.4} color={C.ok} />
      <Packet d={read(202)} dur={2.2} at={1.4} color={C.ok} />
      <Packet d="M572,42 C612,42 612,132 572,132" dur={2.6} at={1.3} color={C.cobalt} r={3.5} />
      <Packet d="M572,42 C630,42 630,202 572,202" dur={2.6} at={1.1} color={C.cobalt} r={3.5} />
      <Box x={40} y={98} type="app" />
      <Box x={460} y={20} type="sqldb" label="Primary" />
      <Box x={460} y={110} type="replica" label="Replica A" />
      <Box x={460} y={180} type="replica" label="Replica B" />
      <Note x={40} y={24} color={C.signal}>
        ● writes go to the primary
      </Note>
      <Note x={40} y={42} color={C.ok}>
        ● reads spread over replicas
      </Note>
      <Note x={40} y={60} color={C.cobalt}>
        ● changes copied in the background
      </Note>
    </>
  );
}

function Sharding() {
  const ys = [8, 66, 124, 182];
  const colors = [C.cobalt, C.signal, C.ok, "#a855f7"];
  const branch = (y: number) => `C360,120 360,${y + 22} 430,${y + 22}`;
  return (
    <>
      <Wire d="M128,120 L190,120" />
      {ys.map((y) => (
        <Wire key={y} d={`M290,120 ${branch(y)}`} />
      ))}
      {ys.map((y, i) => (
        <Packet key={y} d={`M128,120 L290,120 ${branch(y)}`} at={i * 0.6} color={colors[i]} />
      ))}
      <Box x={16} y={98} type="app" />
      <rect x={190} y={102} width={100} height={36} rx={8} style={{ fill: C.card, stroke: C.line }} />
      <text x={240} y={124} textAnchor="middle" style={{ fill: C.ink, fontSize: 12, fontFamily: "var(--font-mono)" }}>
        hash(key)
      </text>
      {ys.map((y, i) => (
        <g key={y}>
          <Box x={430} y={y} type="nosql" label={`Shard ${i + 1}`} />
          <circle cx={556} cy={y + 22} r={4} style={{ fill: colors[i] }} />
        </g>
      ))}
    </>
  );
}

function QueueBuffer() {
  const xs = [10, 140, 270, 400, 530];
  const types: [ComponentType, string][] = [
    ["client", "Users"],
    ["app", "App"],
    ["queue", "Queue"],
    ["worker", "Worker"],
    ["sqldb", "SQL DB"],
  ];
  const burst = { values: "1;1;0;0", keyTimes: "0;0.4;0.42;1" };
  return (
    <>
      {xs.slice(0, -1).map((x) => (
        <Wire key={x} d={`M${x + 100},120 L${x + 130},120`} />
      ))}
      {[0, 0.17, 0.34, 0.51, 0.68, 0.85].map((at) => (
        <Packet key={at} d="M110,120 L270,120" dur={1} at={at}>
          <animate attributeName="opacity" {...burst} dur="6s" repeatCount="indefinite" />
        </Packet>
      ))}
      {[0, 1].map((at) => (
        <Packet key={at} d="M370,120 L530,120" dur={2} at={at} color={C.ok} />
      ))}
      {xs.map((x, i) => (
        <Box key={x} x={x} y={98} w={100} type={types[i][0]} label={types[i][1]} />
      ))}
      <rect x={278} y={150} width={84} height={6} rx={3} style={{ fill: C.line }} />
      <rect x={278} y={150} height={6} rx={3} style={{ fill: C.warn }}>
        <animate attributeName="width" values="2;84;2" keyTimes="0;0.42;1" dur="6s" repeatCount="indefinite" />
      </rect>
      <Note x={320} y={176} anchor="middle">
        backlog
      </Note>
      <Note x={135} y={78} anchor="middle" color={C.signal}>
        bursty arrivals
      </Note>
      <Note x={465} y={78} anchor="middle" color={C.ok}>
        steady drain
      </Note>
    </>
  );
}

function RateLimit() {
  const user = "M128,62 C190,62 190,120 250,120 L470,120";
  const bot = "M128,178 C190,178 190,120 250,120";
  return (
    <>
      <Wire d="M128,62 C190,62 190,120 250,120" />
      <Wire d={bot} />
      <Wire d="M362,120 L470,120" />
      {[0, 1.2].map((at) => (
        <Packet key={at} d={user} at={at} color={C.ok} />
      ))}
      {[0, 0.4, 0.8, 1.2, 1.6, 2].map((at) => (
        <Packet key={at} d={bot} at={at} color={C.bad} />
      ))}
      <Box x={16} y={40} type="client" />
      <Box x={16} y={156} type="client" label="Bots" icon={Bot} />
      <Box x={250} y={98} type="gateway" label="Gateway" />
      <Box x={470} y={98} type="app" />
      <Note x={306} y={164} anchor="middle" color={C.bad}>
        over the limit: rejected (429)
      </Note>
    </>
  );
}

function LatencyCurve() {
  const pts: string[] = [];
  for (let u = 0; u <= 0.961; u += 0.02) pts.push(`${(60 + 540 * u).toFixed(1)},${(200 - (1 / (1 - u) - 1) * (170 / 24)).toFixed(1)}`);
  const curve = `M${pts.join(" L")}`;
  return (
    <>
      <rect x={60} y={20} width={378} height={180} style={{ fill: C.ok, fillOpacity: 0.07 }} />
      <rect x={438} y={20} width={108} height={180} style={{ fill: C.warn, fillOpacity: 0.09 }} />
      <rect x={546} y={20} width={54} height={180} style={{ fill: C.bad, fillOpacity: 0.1 }} />
      <path d="M60,20 L60,200 L600,200" style={{ fill: "none", stroke: C.soft, strokeWidth: 1 }} />
      <path d={curve} style={{ fill: "none", stroke: C.signal, strokeWidth: 2.5 }} />
      {[
        [330, "50%"],
        [438, "70%"],
        [546, "90%"],
      ].map(([x, t]) => (
        <Note key={t} x={Number(x)} y={216} anchor="middle">
          {t}
        </Note>
      ))}
      <Note x={600} y={232} anchor="end">
        utilisation (how busy)
      </Note>
      <Note x={52} y={30} anchor="end">
        latency
      </Note>
      <Note x={250} y={188} anchor="middle" color={C.ok}>
        comfortable
      </Note>
      <Note x={556} y={90} anchor="end" color={C.bad}>
        queueing
      </Note>
      <circle r={6} style={{ fill: C.signal, stroke: C.card, strokeWidth: 2 }}>
        <animateMotion path={curve} dur="7s" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" repeatCount="indefinite" />
      </circle>
    </>
  );
}

function WebSockets() {
  const left = [20, 98, 176];
  const right = [40, 156];
  const l = (y: number) => `M128,${y + 22} C190,${y + 22} 190,120 250,120`;
  const r = (y: number) => `M362,120 C420,120 420,${y + 22} 480,${y + 22}`;
  return (
    <>
      {left.map((y) => (
        <path key={y} d={l(y)} style={{ fill: "none", stroke: C.cobalt, strokeOpacity: 0.35, strokeWidth: 3 }} />
      ))}
      {right.map((y) => (
        <path key={y} d={r(y)} style={{ fill: "none", stroke: C.cobalt, strokeOpacity: 0.35, strokeWidth: 3 }} />
      ))}
      <Packet d={`${l(20)} ${r(40).replace("M", "L")}`} dur={2.4} />
      <Packet d={`${l(176)} ${r(156).replace("M", "L")}`} dur={2.4} at={1.2} />
      <Packet d="M480,62 C420,62 420,120 362,120 L250,120 C190,120 190,120 128,120" dur={2.4} at={0.6} color={C.ok} />
      {left.map((y) => (
        <Box key={y} x={16} y={y} type="client" label="Phone" />
      ))}
      <Box x={250} y={98} type="ws" label="Realtime" />
      {right.map((y) => (
        <Box key={y} x={480} y={y} type="client" label="Phone" />
      ))}
      <Note x={306} y={84} anchor="middle" color={C.cobalt}>
        connections stay open
      </Note>
    </>
  );
}

function GeoSearch() {
  const drivers = [
    [250, 80],
    [380, 150],
    [300, 170],
    [420, 70],
    [120, 60],
    [540, 180],
    [520, 50],
    [160, 190],
  ];
  return (
    <>
      <rect x={20} y={10} width={600} height={220} rx={12} style={{ fill: C.card, stroke: C.line }} />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={`v${i}`} d={`M${60 + i * 40},10 L${60 + i * 40},230`} style={{ stroke: C.line, strokeWidth: 1 }} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <path key={`h${i}`} d={`M20,${50 + i * 40} L620,${50 + i * 40}`} style={{ stroke: C.line, strokeWidth: 1 }} />
      ))}
      <rect x={260} y={90} width={120} height={80} style={{ fill: C.ok, fillOpacity: 0.08 }} />
      <circle cx={320} cy={120} r={10} style={{ fill: C.ok, fillOpacity: 0.25 }}>
        <animate attributeName="r" values="10;95" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="fill-opacity" values="0.35;0" dur="2.6s" repeatCount="indefinite" />
      </circle>
      {drivers.map(([x, y], i) => (
        <g key={i}>
          <animateMotion path={`M0,0 l${i % 2 ? 16 : -16},${i % 3 ? 10 : -10} l${i % 2 ? -10 : 12},${i % 3 ? 8 : -6} Z`} dur={`${5 + (i % 3)}s`} repeatCount="indefinite" />
          <Car x={x - 9} y={y - 9} width={18} height={18} style={{ color: Math.hypot(x - 320, y - 120) < 110 ? C.ok : C.soft }} />
        </g>
      ))}
      <MapPin x={308} y={102} width={24} height={24} style={{ color: C.signal }} />
      <Note x={334} y={150}>
        rider
      </Note>
      <Note x={30} y={224}>
        Only nearby cells are searched
      </Note>
    </>
  );
}

function FanOut() {
  const ys = [0, 48, 96, 144, 192];
  const branch = (y: number) => `C380,120 380,${y + 20} 440,${y + 20}`;
  return (
    <>
      <Wire d="M128,120 L190,120" />
      {ys.map((y) => (
        <Wire key={y} d={`M302,120 ${branch(y)}`} />
      ))}
      <Packet d="M16,120 L128,120 L190,120 L302,120" dur={3} at={0} r={5} />
      {ys.map((y) => (
        <Packet key={y} d={`M302,120 ${branch(y)}`} dur={3} at={1.5} r={3.5} color={C.cobalt} />
      ))}
      <Box x={16} y={98} type="client" label="Author" />
      <Box x={190} y={98} type="worker" label="Fan-out" />
      {ys.map((y, i) => (
        <Box key={y} x={440} y={y} h={40} w={130} type="cache" label={`Timeline ${i + 1}`} />
      ))}
      <Note x={505} y={238} anchor="middle" color={C.cobalt}>
        one copy per follower
      </Note>
    </>
  );
}

function DirectUpload() {
  return (
    <>
      <Wire d="M128,120 C180,120 180,42 230,42" />
      <Wire d="M128,120 C180,120 180,198 230,198" />
      <Wire d="M342,198 L460,198" />
      <Wire d="M516,176 L516,64" />
      <Packet d="M128,120 C180,120 180,42 230,42 C180,42 180,120 128,120" dur={2.4} r={3.5} color={C.cobalt} />
      <Packet d="M128,120 C180,120 180,198 230,198" dur={2.4} at={1.2} r={7} />
      <Packet d="M342,198 L460,198 L516,176 L516,64" dur={2.4} at={0.4} color={C.ok} />
      <Box x={16} y={98} type="client" />
      <Box x={230} y={20} type="app" />
      <Box x={230} y={176} type="blob" label="Storage" />
      <Box x={460} y={176} type="cdn" />
      <Box x={460} y={20} type="client" label="Viewers" />
      <Note x={286} y={92} anchor="middle" color={C.cobalt}>
        tiny: &ldquo;may I upload?&rdquo;
      </Note>
      <Note x={190} y={236} anchor="middle" color={C.signal}>
        big file goes straight to storage
      </Note>
    </>
  );
}

export const CONCEPTS = {
  lb: { title: "Load balancing", caption: "The load balancer gives users one address and hands each request to the next server in turn.", Svg: LoadBalancing },
  cache: { title: "Cache hits and misses", caption: "Most reads are answered from memory; only the misses travel on to the database.", Svg: CacheAside },
  cdn: { title: "Serving from the edge", caption: "Each user is served by the closest edge server; only cache misses travel back to the origin.", Svg: EdgeCdn },
  failover: { title: "Surviving a crash", caption: "When a server dies, health checks notice and traffic flows to the survivor until it recovers.", Svg: Failover },
  replication: { title: "Primary and replicas", caption: "Writes go to one primary, reads spread across replicas, and changes are copied over in the background.", Svg: Replication },
  sharding: { title: "Sharding by key", caption: "A hash of each key decides its shard, so every shard holds and serves only its slice of the data.", Svg: Sharding },
  queue: { title: "A queue absorbs bursts", caption: "Requests arrive in bursts; the queue holds the backlog while workers drain it at a steady pace.", Svg: QueueBuffer },
  ratelimit: { title: "Rate limiting at the gateway", caption: "Normal users pass straight through; clients over their limit are turned away before they reach your servers.", Svg: RateLimit },
  latency: { title: "Why headroom matters", caption: "Latency stays flat until a component is about 70% busy, then climbs steeply as requests queue.", Svg: LatencyCurve },
  websocket: { title: "Push over open connections", caption: "Each phone keeps one connection open, so the gateway can push messages both ways instantly, without polling.", Svg: WebSockets },
  geo: { title: "Finding what is nearby", caption: "Locations are bucketed into cells, so a nearby search only looks at the cells around the rider.", Svg: GeoSearch },
  fanout: { title: "Fan-out on write", caption: "A new post is copied into every follower's timeline, so reading a timeline is one quick lookup.", Svg: FanOut },
  upload: { title: "Uploads skip the app server", caption: "The app only grants permission; the file goes straight to object storage, and viewers get it from the CDN.", Svg: DirectUpload },
} satisfies Record<ConceptId, unknown>;

export function ConceptAnimation({ id }: { id: ConceptId }) {
  const { title, caption, Svg } = CONCEPTS[id];
  const ref = useRef<SVGSVGElement>(null);
  const [playing, setPlaying] = useState(true);

  // SMIL ignores prefers-reduced-motion, so pause it ourselves.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.pauseAnimations();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with a browser preference read once on mount
      setPlaying(false);
    }
  }, []);

  const toggle = () => {
    if (playing) ref.current?.pauseAnimations();
    else ref.current?.unpauseAnimations();
    setPlaying(!playing);
  };

  return (
    <figure className="overflow-hidden rounded-2xl border border-line" data-testid={`concept-${id}`}>
      <div className="blueprint relative px-3 py-4">
        <svg ref={ref} viewBox="0 0 640 240" className="mx-auto block h-auto w-full max-w-[640px]" role="img" aria-label={`${title}: ${caption}`}>
          <Svg />
        </svg>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause animation" : "Play animation"}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-ink-soft shadow-sm hover:text-ink"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
      <figcaption className="bg-card px-5 py-4 text-sm">
        <span className="font-semibold">{title}.</span> <span className="text-ink-soft">{caption}</span>
      </figcaption>
    </figure>
  );
}
