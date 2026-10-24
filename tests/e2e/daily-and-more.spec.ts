import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { dailyLevel, dayNumber, todayUtc } from "@/content/daily";
import { getLevel } from "@/content";
import { openWithDesign, runToResults, signUp, starsIn } from "./helpers";

test("today's daily challenge can be played, shared and ranked", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const today = todayUtc();
  const level = dailyLevel(today);
  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: level.title })).toBeVisible();

  await signUp(page, "Katherine Johnson");
  await openWithDesign(page, level.id, level.solution);
  const results = await runToResults(page);
  expect(await starsIn(page)).toBe(3);
  await expect(results.getByTestId("xp-result")).toContainText("+90 XP");
  await results.getByRole("button", { name: "Share score" }).click();
  await expect(results.getByRole("button", { name: "Copied!" })).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain(`System Sketch Lab Daily #${dayNumber(today)} ⭐⭐⭐`);

  await page.goto("/daily");
  await expect(page.getByTestId("daily-board")).toContainText("Katherine Johnson");
  await page.goto("/leaderboard?tab=daily");
  await expect(page.getByTestId("leaderboard")).toContainText("Katherine Johnson");
  await page.goto("/leaderboard");
  await expect(page.getByTestId("leaderboard")).toContainText("Katherine Johnson");
});

test("future daily challenges do not exist yet", async ({ page }) => {
  const res = await page.goto("/play/daily-2999-01-01");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page is down." })).toBeVisible();
});

test("the sandbox runs any traffic without scoring or saving", async ({ page }) => {
  await page.goto("/sandbox");
  await page.getByLabel("Reads per second").fill("50000");
  const results = await runToResults(page);
  await expect(results).toContainText("Simulation complete");
  await expect(results.getByTestId("issues")).toContainText("capacity");
  await expect(results.getByRole("link", { name: "Save my progress" })).toHaveCount(0);
});

test.describe("API safety", () => {
  test("runs require a session", async ({ request }) => {
    const res = await request.post("/api/runs", { data: { levelId: "hello-server", design: getLevel("hello-server")!.solution } });
    expect(res.status()).toBe(401);
  });

  test("the server re-validates every submission", async ({ page }) => {
    await signUp(page, "Mallory");
    const api = page.request;
    const over = { nodes: [{ id: "users", type: "client", instances: 1 }, { id: "a", type: "app", instances: 20 }], edges: [{ from: "users", to: "a" }] };
    const r1 = await api.post("/api/runs", { data: { levelId: "hello-server", design: over } });
    expect(r1.status()).toBe(400);
    expect((await r1.json()).details.join(" ")).toMatch(/budget/);
    const r2 = await api.post("/api/runs", { data: { levelId: "queue-the-writes", design: getLevel("queue-the-writes")!.solution } });
    expect(r2.status()).toBe(403);
    const r3 = await api.post("/api/runs", { data: { levelId: "nope", design: over } });
    expect(r3.status()).toBe(404);
    const r4 = await api.post("/api/billing/checkout", { data: { plan: "free-forever" } });
    expect(r4.status()).toBe(400);
  });

  test("billing webhooks need a valid signature", async ({ request }) => {
    const body = JSON.stringify({ meta: { event_name: "order_created", custom_data: { user_id: "x", plan: "lifetime" } }, data: { id: "1" } });
    const bad = await request.post("/api/billing/webhook", { data: body, headers: { "content-type": "application/json", "x-signature": "deadbeef" } });
    expect(bad.status()).toBe(401);
    const sig = crypto.createHmac("sha256", "e2e_webhook_secret").update(body).digest("hex");
    const good = await request.post("/api/billing/webhook", { data: body, headers: { "content-type": "application/json", "x-signature": sig } });
    expect(good.status()).toBe(200);
  });
});
