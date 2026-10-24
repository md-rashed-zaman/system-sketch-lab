import crypto from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getLevel } from "@/content";
import { dailyLevel, todayUtc } from "@/content/daily";
import { design } from "@/engine/design";
import { earnedBadges, nextStreak, rankFor, xpGain } from "./gamification";

vi.stubEnv("DATABASE_PATH", ":memory:");
vi.stubEnv("PAYMENTS_MODE", "test");
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-test-secret-test-secret-123");

type Progress = typeof import("./progress");
type Billing = typeof import("./billing");
let progress: Progress;
let billing: Billing;

async function createUser(name: string) {
  const { auth } = await import("./auth");
  const res = await auth.api.signUpEmail({ body: { name, email: `${name.toLowerCase()}@example.test`, password: "correct-horse-1" } });
  return res.user.id;
}

beforeAll(async () => {
  const { getMigrations } = await import("better-auth/db/migration");
  const { auth } = await import("./auth");
  await (await getMigrations(auth.options)).runMigrations();
  progress = await import("./progress");
  billing = await import("./billing");
});

describe("gamification rules", () => {
  it("maps XP to ranks with progress toward the next one", () => {
    expect(rankFor(0).rank.title).toBe("Intern");
    expect(rankFor(300).rank.title).toBe("Junior Engineer");
    expect(rankFor(600).progress).toBeCloseTo(0.5);
    expect(rankFor(50_000).next).toBeUndefined();
  });

  it("pays XP only for newly earned stars", () => {
    expect(xpGain(0, 3, 50)).toBe(150);
    expect(xpGain(2, 3, 50)).toBe(50);
    expect(xpGain(3, 1, 50)).toBe(0);
  });

  it("extends, keeps or resets streaks by UTC day", () => {
    expect(nextStreak(null, "2026-10-24", 0)).toBe(1);
    expect(nextStreak("2026-10-24", "2026-10-24", 4)).toBe(4);
    expect(nextStreak("2026-10-23", "2026-10-24", 4)).toBe(5);
    expect(nextStreak("2026-10-20", "2026-10-24", 4)).toBe(1);
  });

  it("awards badges from progress", () => {
    const ids = earnedBadges({
      passedLevels: new Set(["hello-server", "scale-out", "no-single-point-of-failure"]),
      threeStarLevels: new Set(["hello-server"]),
      chapters: [{ id: 1, title: "Foundations", levelIds: ["hello-server", "scale-out", "no-single-point-of-failure"] }],
      uberStageIds: ["uber-1"],
      streak: 7,
      dailyPlays: 0,
    });
    expect(ids).toEqual(expect.arrayContaining(["first-deploy", "three-stars", "chapter-1", "streak-7"]));
    expect(ids).not.toContain("uber-architect");
  });
});

describe("submitRun", () => {
  it("re-simulates on the server, records progress and awards XP once", async () => {
    const uid = await createUser("Ada");
    const level = getLevel("hello-server")!;
    const first = progress.submitRun(uid, level.id, level.solution);
    expect(first.evaluation.stars).toBe(3);
    expect(first.xpGained).toBe(150);
    expect(first.newBadges).toEqual(expect.arrayContaining(["first-deploy", "three-stars", "frugal"]));
    expect(first.streak).toBe(1);

    const again = progress.submitRun(uid, level.id, level.solution);
    expect(again.xpGained).toBe(0);
    expect(again.newBadges).toEqual([]);

    // A worse design is recorded as an attempt but does not replace the best design.
    const worse = design([["app", "app", 2], ["db", "sqldb"]], ["users>app", "app>db"]);
    progress.submitRun(uid, level.id, worse);
    const p = progress.getProgressMap(uid).get(level.id)!;
    expect(p).toMatchObject({ stars: 3, credits: 40, attempts: 3 });
    expect(progress.getBestDesign(uid, level.id)).toEqual(level.solution);
    expect(progress.getProfile(uid).xp).toBe(150);
  });

  it("rejects invalid and over-budget designs with reasons", async () => {
    const uid = await createUser("Bob");
    expect(() => progress.submitRun(uid, "hello-server", { nodes: [], edges: [] })).toThrowError(/Invalid design/);
    const pricey = design([["app", "app", 5], ["db", "sqldb"]], ["users>app", "app>db"]);
    try {
      progress.submitRun(uid, "hello-server", pricey);
      expect.unreachable();
    } catch (e) {
      expect((e as InstanceType<Progress["RunError"]>).status).toBe(400);
      expect((e as InstanceType<Progress["RunError"]>).details?.[0]).toMatch(/budget/);
    }
    expect(() => progress.submitRun(uid, "no-such-level", {})).toThrowError(/Unknown level/);
  });

  it("gates Pro levels and unlocks them after a test checkout", async () => {
    const uid = await createUser("Cleo");
    const pro = getLevel("queue-the-writes")!;
    expect(() => progress.submitRun(uid, pro.id, pro.solution)).toThrowError(/Pro/);
    billing.completeTestCheckout(uid, "yearly");
    expect(progress.getProfile(uid).plan).toBe("yearly");
    expect(progress.submitRun(uid, pro.id, pro.solution).evaluation.stars).toBe(3);
    billing.cancelTestPlan(uid);
    expect(progress.getProfile(uid).plan).toBe("free");
  });

  it("locks case-study stages until the previous stage is passed", async () => {
    const uid = await createUser("Dan");
    const s2 = getLevel("uber-2")!;
    expect(() => progress.submitRun(uid, s2.id, s2.solution)).toThrowError(/previous stage/);
    progress.submitRun(uid, "uber-1", getLevel("uber-1")!.solution);
    expect(progress.submitRun(uid, s2.id, s2.solution).evaluation.passed).toBe(true);
  });

  it("scores daily challenges and ranks them by stars, then credits", async () => {
    const a = await createUser("Eve");
    const b = await createUser("Finn");
    const level = dailyLevel(todayUtc());
    progress.submitRun(a, level.id, level.solution);
    const pricier = { ...level.solution, nodes: level.solution.nodes.map((n) => (n.type === "app" && n.instances < 20 ? { ...n, instances: n.instances + 1 } : n)) };
    progress.submitRun(b, level.id, pricier);
    const board = progress.dailyLeaderboard(todayUtc());
    expect(board.map((r) => r.name)).toEqual(["Eve", "Finn"]);
    expect(progress.xpLeaderboard().some((r) => r.name === "Eve")).toBe(true);
    expect(() => progress.submitRun(a, "daily-2999-01-01", level.solution)).toThrowError(/Unknown level/);
  });
});

describe("billing webhooks", () => {
  const secret = "whsec_test";

  it("verifies Lemon Squeezy signatures in constant time", () => {
    const body = JSON.stringify({ hello: "world" });
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(billing.verifySignature(body, sig, secret)).toBe(true);
    expect(billing.verifySignature(body + " ", sig, secret)).toBe(false);
    expect(billing.verifySignature(body, null, secret)).toBe(false);
    expect(billing.verifySignature(body, "short", secret)).toBe(false);
  });

  it("applies subscription events idempotently", async () => {
    const uid = await createUser("Gus");
    const created = { meta: { event_name: "subscription_created", custom_data: { user_id: uid, plan: "monthly" } }, data: { id: "sub_1", attributes: { status: "active" } } };
    expect(billing.handleWebhook(created)).toEqual({ applied: true, plan: "monthly" });
    expect(billing.handleWebhook(created)).toEqual({ applied: false });
    expect(progress.getProfile(uid).plan).toBe("monthly");
    const expired = { ...created, meta: { ...created.meta, event_name: "subscription_expired" }, data: { id: "sub_1", attributes: { status: "expired" } } };
    expect(billing.handleWebhook(expired)).toEqual({ applied: true, plan: "free" });
    expect(progress.getProfile(uid).plan).toBe("free");
  });
});
