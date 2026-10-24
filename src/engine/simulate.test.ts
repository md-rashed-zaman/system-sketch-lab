import { describe, expect, it } from "vitest";
import { design } from "./design";
import { evaluate } from "./scoring";
import { designCredits, simulate, validateDesign } from "./simulate";

const steady = (traffic: Parameters<typeof simulate>[1]["traffic"]) => ({ traffic, curve: "steady" as const });

describe("simulate", () => {
  it("serves a simple app + database path", () => {
    const r = simulate(design([["app", "app"], ["db", "sqldb"]], ["users>app", "app>db"]), steady({ read: 300, write: 50 }));
    expect(r.availability).toBe(1);
    expect(r.p95).toBeGreaterThan(15);
    expect(r.p95).toBeLessThan(40);
    expect(r.credits).toBe(40);
    expect(r.issues.filter((i) => i.severity === "high")).toHaveLength(0);
  });

  it("is deterministic", () => {
    const d = design([["lb", "lb"], ["app", "app", 3], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]);
    const s = { traffic: { read: 2000, write: 100 }, curve: "spike" as const, failures: [{ at: 10, duration: 5, type: "app" as const, count: 1 }] };
    expect(simulate(d, s)).toEqual(simulate(d, s));
  });

  it("fails requests that skip the app tier and explains why", () => {
    const r = simulate(design([["db", "sqldb"]], ["users>db"]), steady({ read: 100 }));
    expect(r.availability).toBe(0);
    expect(r.issues[0]).toMatchObject({ kind: "dead-end", severity: "high" });
    expect(r.issues[0].message).toMatch(/App Server/);
  });

  it("drops traffic proportionally when a component is overloaded", () => {
    const r = simulate(design([["app", "app"], ["db", "sqldb"]], ["users>app", "app>db"]), steady({ read: 2000 }));
    expect(r.availability).toBeCloseTo(0.5, 2);
    expect(r.issues.some((i) => i.kind === "overload" && i.nodeId === "app")).toBe(true);
  });

  it("only uses one instance of a pool without a load balancer", () => {
    const withoutLb = simulate(design([["app", "app", 3], ["db", "sqldb"]], ["users>app", "app>db"]), steady({ read: 2000 }));
    const withLb = simulate(design([["lb", "lb"], ["app", "app", 3], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]), steady({ read: 2000 }));
    expect(withoutLb.availability).toBeLessThan(0.6);
    expect(withoutLb.issues.some((i) => /Load Balancer in front/.test(i.message))).toBe(true);
    expect(withLb.availability).toBe(1);
  });

  it("sends reads to the cache first and misses to the database (cache-aside)", () => {
    const r = simulate(
      design([["app", "app", 1], ["cache", "cache"], ["db", "sqldb"]], ["users>app", "app>cache", "app>db"]),
      steady({ read: 500 }),
    );
    const t = r.ticks[0];
    expect(t.load.cache).toBeCloseTo(500);
    expect(t.load.db).toBeCloseTo(100); // 20% misses
    expect(r.availability).toBe(1);
  });

  it("routes static files through the CDN and dynamic traffic around it", () => {
    const r = simulate(
      design([["cdn", "cdn"], ["blob", "blob"], ["app", "app"], ["db", "sqldb"]], ["users>cdn", "cdn>blob", "users>app", "app>db"]),
      steady({ static: 1000, read: 200 }),
    );
    const t = r.ticks[0];
    expect(t.load.cdn).toBeCloseTo(1000);
    expect(t.load.blob).toBeCloseTo(100);
    expect(t.load.app).toBeCloseTo(200);
    expect(r.availability).toBe(1);
  });

  it("blocks bots at the gateway without counting them against availability", () => {
    const withGw = simulate(
      design([["gw", "gateway"], ["app", "app", 2], ["db", "sqldb"]], ["users>gw", "gw>app", "app>db"]),
      steady({ read: 500, abuse: 5000 }),
    );
    expect(withGw.availability).toBe(1);
    expect(withGw.ticks[0].blocked).toBeCloseTo(5000);
    const noGw = simulate(design([["lb", "lb"], ["app", "app", 2], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]), steady({ read: 500, abuse: 5000 }));
    expect(noGw.availability).toBeLessThan(0.5);
    expect(noGw.issues.some((i) => i.kind === "abuse")).toBe(true);
  });

  it("queues writes and drains them with workers", () => {
    const d = design(
      [["app", "app"], ["queue", "queue"], ["worker", "worker", 2], ["db", "sqldb"]],
      ["users>app", "app>queue", "queue>worker", "worker>db"],
    );
    const r = simulate(d, steady({ write: 500 }));
    expect(r.availability).toBe(1);
    expect(r.maxLagSec).toBeLessThan(1);
    expect(r.ticks[5].load.db).toBeCloseTo(2000); // 500 writes x 4 units
  });

  it("reports a growing backlog when nothing drains the queue", () => {
    const r = simulate(design([["app", "app"], ["queue", "queue"]], ["users>app", "app>queue"]), steady({ write: 500 }));
    expect(r.availability).toBe(1);
    expect(r.maxLagSec).toBeGreaterThan(1000);
    expect(r.issues.some((i) => i.kind === "backlog")).toBe(true);
  });

  it("turns a single point of failure into an outage and redundancy into a non-event", () => {
    const s = { traffic: { read: 500 }, curve: "steady" as const, failures: [{ at: 10, duration: 10, type: "lb" as const, count: 1 }] };
    const single = simulate(design([["lb", "lb"], ["app", "app"], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]), s);
    const double = simulate(design([["lb", "lb", 2], ["app", "app"], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]), s);
    expect(single.failureAvailability).toBe(0);
    expect(single.availability).toBeCloseTo(0.75, 5);
    expect(single.issues.some((i) => i.kind === "outage")).toBe(true);
    expect(double.availability).toBe(1);
  });

  it("treats a second SQL instance as a standby, not extra capacity", () => {
    const one = simulate(design([["app", "app", 1], ["db", "sqldb", 1]], ["users>app", "app>db"]), steady({ write: 200 }));
    const two = simulate(design([["app", "app", 1], ["db", "sqldb", 2]], ["users>app", "app>db"]), steady({ write: 200 }));
    expect(one.ticks[0].util.db).toBeCloseTo(two.ticks[0].util.db);
  });

  it("flags idle components as wasted credits", () => {
    const r = simulate(design([["app", "app"], ["db", "sqldb"], ["cache", "cache"]], ["users>app", "app>db"]), steady({ read: 100 }));
    expect(r.issues.some((i) => i.kind === "idle" && i.nodeId === "cache")).toBe(true);
  });
});

describe("validateDesign", () => {
  const ok = design([["app", "app"], ["db", "sqldb"]], ["users>app", "app>db"]);

  it("accepts a valid design", () => {
    expect(validateDesign(ok, { palette: ["app", "sqldb"], budget: 40 })).toEqual([]);
  });

  it("enforces the budget, the palette and instance limits", () => {
    expect(validateDesign(ok, { budget: 39 })[0]).toMatch(/budget/);
    expect(validateDesign(ok, { palette: ["app"] })[0]).toMatch(/not available/);
    const big = { ...ok, nodes: ok.nodes.map((n) => (n.id === "db" ? { ...n, instances: 3 } : n)) };
    expect(validateDesign(big)[0]).toMatch(/between 1 and 2/);
  });

  it("rejects malformed designs", () => {
    expect(validateDesign({ nodes: [], edges: [] })).toContain("A design needs exactly one Users node.");
    expect(validateDesign({ ...ok, edges: [{ from: "app", to: "app" }] })).toContain("A component cannot connect to itself.");
    expect(validateDesign({ ...ok, edges: [{ from: "app", to: "ghost" }] })).toContain("A connection points to a missing component.");
    // @ts-expect-error deliberately invalid input
    expect(validateDesign({ nodes: "x" })).toEqual(["Design must have nodes and edges."]);
  });

  it("prices designs from the component catalogue", () => {
    expect(designCredits(ok)).toBe(40);
  });
});

describe("evaluate", () => {
  it("awards stars only when objectives pass", () => {
    const r = simulate(design([["app", "app"], ["db", "sqldb"]], ["users>app", "app>db"]), steady({ read: 300 }));
    const pass = evaluate({ minAvailability: 0.99, maxP95: 100 }, [{ kind: "credits", value: 40 }, { kind: "p95", value: 1 }], r);
    expect(pass.stars).toBe(2);
    const fail = evaluate({ minAvailability: 0.99, maxP95: 1 }, [{ kind: "credits", value: 40 }], r);
    expect(fail).toMatchObject({ passed: false, stars: 0 });
  });
});
