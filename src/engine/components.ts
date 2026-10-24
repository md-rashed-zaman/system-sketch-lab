import type { ComponentType, RequestClass } from "./types";

export interface ComponentSpec {
  type: ComponentType;
  label: string;
  short: string;
  /** Credits per instance. */
  cost: number;
  /** Capacity units per instance per second. */
  capacity: number;
  /** Latency added when idle, in ms. */
  baseMs: number;
  maxInstances: number;
  /** Extra instances add standby redundancy only, not capacity (a primary database). */
  standby?: boolean;
  description: string;
}

export const COMPONENTS: Record<ComponentType, ComponentSpec> = {
  client: { type: "client", label: "Users", short: "Users", cost: 0, capacity: Infinity, baseMs: 0, maxInstances: 1, description: "Where traffic comes from: browsers and mobile apps." },
  cdn: { type: "cdn", label: "CDN", short: "CDN", cost: 25, capacity: 100_000, baseMs: 15, maxInstances: 1, description: "Edge servers near users. Serves about 90% of static files from cache; forwards everything else." },
  lb: { type: "lb", label: "Load Balancer", short: "LB", cost: 10, capacity: 20_000, baseMs: 1, maxInstances: 3, description: "Spreads requests evenly across the servers behind it. Two instances remove it as a single point of failure." },
  gateway: { type: "gateway", label: "API Gateway", short: "Gateway", cost: 15, capacity: 20_000, baseMs: 2, maxInstances: 3, description: "Front door with rate limiting: blocks bot and abusive traffic before it reaches your servers." },
  app: { type: "app", label: "App Server", short: "App", cost: 10, capacity: 1_000, baseMs: 15, maxInstances: 20, description: "Runs your business logic. About 1,000 requests per second per instance. Can serve static files itself, slowly." },
  ws: { type: "ws", label: "Realtime Gateway", short: "WebSocket", cost: 15, capacity: 10_000, baseMs: 2, maxInstances: 10, description: "Holds long-lived WebSocket connections for chat and live location; much cheaper per message than an app server." },
  cache: { type: "cache", label: "Cache", short: "Cache", cost: 15, capacity: 20_000, baseMs: 1, maxInstances: 6, description: "In-memory store (like Redis). Answers about 80% of reads; misses go to the database behind it." },
  sqldb: { type: "sqldb", label: "SQL Database", short: "SQL DB", cost: 30, capacity: 3_000, baseMs: 5, maxInstances: 2, standby: true, description: "Primary relational database. Reads cost 1 unit, writes 4 (indexes, logs). A second instance is a hot standby for failover, not extra capacity." },
  replica: { type: "replica", label: "Read Replica", short: "Replica", cost: 20, capacity: 3_000, baseMs: 5, maxInstances: 6, description: "Read-only copy of the database. Takes read traffic off the primary; cannot accept writes." },
  nosql: { type: "nosql", label: "Sharded NoSQL", short: "NoSQL", cost: 25, capacity: 4_000, baseMs: 4, maxInstances: 12, description: "Key-value store split into shards. Writes are cheap and capacity grows with every shard. Instances = shards." },
  queue: { type: "queue", label: "Message Queue", short: "Queue", cost: 10, capacity: 50_000, baseMs: 2, maxInstances: 3, description: "Accepts work instantly and holds it until workers process it. Smooths spikes; adds delay." },
  worker: { type: "worker", label: "Worker", short: "Worker", cost: 8, capacity: 300, baseMs: 0, maxInstances: 20, description: "Background processor. Pulls jobs from a queue and writes results to a database. About 300 jobs per second each." },
  blob: { type: "blob", label: "Object Storage", short: "Storage", cost: 10, capacity: 50_000, baseMs: 40, maxInstances: 1, description: "Cheap, durable storage for files, images and video (like S3). Origin for a CDN." },
  geo: { type: "geo", label: "Geo Index", short: "Geo", cost: 20, capacity: 20_000, baseMs: 1, maxInstances: 6, description: "In-memory spatial index. Stores live locations and answers 'who is near me' fast." },
};

export const PLACEABLE: ComponentType[] = ["cdn", "lb", "gateway", "app", "ws", "cache", "sqldb", "replica", "nosql", "queue", "worker", "blob", "geo"];

export const CLASS_LABELS: Record<RequestClass, string> = {
  read: "Reads",
  write: "Writes",
  static: "Static files",
  upload: "Uploads",
  loc: "Location updates",
  nearby: "Nearby searches",
  message: "Chat messages",
  abuse: "Bot traffic",
};

/** Capacity units one request of a class consumes at a component; missing entries cost 1. */
const WEIGHTS: Partial<Record<ComponentType, Partial<Record<RequestClass, number>>>> = {
  app: { upload: 3 },
  sqldb: { write: 4, loc: 4, message: 4, nearby: 10 },
  replica: { nearby: 10 },
  nosql: { nearby: 10 },
  geo: { nearby: 2 },
};

export function weight(type: ComponentType, cls: RequestClass): number {
  return WEIGHTS[type]?.[cls] ?? 1;
}

export const CACHE_HIT = 0.8;
export const CDN_HIT = 0.9;
export const QUEUE_MAX_BACKLOG = 200_000;
