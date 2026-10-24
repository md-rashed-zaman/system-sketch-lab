export type ComponentType =
  | "client"
  | "cdn"
  | "lb"
  | "gateway"
  | "app"
  | "ws"
  | "cache"
  | "sqldb"
  | "replica"
  | "nosql"
  | "queue"
  | "worker"
  | "blob"
  | "geo";

/** Kinds of traffic a scenario sends. `abuse` is bot traffic: it never counts toward availability. */
export type RequestClass = "read" | "write" | "static" | "upload" | "loc" | "nearby" | "message" | "abuse";

export interface DesignNode {
  id: string;
  type: ComponentType;
  instances: number;
  x?: number;
  y?: number;
}

export interface DesignEdge {
  from: string;
  to: string;
}

export interface Design {
  nodes: DesignNode[];
  edges: DesignEdge[];
}

export type Curve = "steady" | "ramp" | "spike" | "wave";

export interface Failure {
  /** First tick the failure is active. */
  at: number;
  duration: number;
  /** Instances are removed from the first node of this type (by id), like "server A crashes". */
  type: ComponentType;
  count: number;
}

export interface Scenario {
  /** Requests per second at peak, per class. */
  traffic: Partial<Record<RequestClass, number>>;
  curve: Curve;
  ticks?: number;
  failures?: Failure[];
}

export interface TickResult {
  t: number;
  /** Legitimate requests per second offered this tick. */
  offered: number;
  succeeded: number;
  failed: number;
  blocked: number;
  p95: number;
  util: Record<string, number>;
  load: Record<string, number>;
  backlog: number;
  lagSec: number;
  down: string[];
}

export type IssueKind = "overload" | "dead-end" | "outage" | "backlog" | "abuse" | "idle" | "queue-full";

export interface Issue {
  kind: IssueKind;
  nodeId?: string;
  requestClass?: RequestClass;
  severity: "high" | "medium" | "low";
  message: string;
}

export interface SimResult {
  ticks: TickResult[];
  availability: number;
  p95: number;
  credits: number;
  maxLagSec: number;
  /** Availability measured only during ticks with an active failure (1 when the scenario has none). */
  failureAvailability: number;
  peakUtil: Record<string, { u: number; t: number }>;
  issues: Issue[];
}
