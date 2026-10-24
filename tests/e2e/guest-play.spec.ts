import { expect, test, type Locator, type Page } from "@playwright/test";
import { getArticle, getLevel } from "@/content";
import { TOPIC_CONCEPTS } from "@/content/concepts";
import { runToResults, starsIn } from "./helpers";

const node = (page: Page, type: string) => page.locator(".react-flow__node", { has: page.getByTestId(`node-${type}`) });

/** Waits until an element stops moving (the canvas animates its viewport after components are added). */
async function settledBox(l: Locator) {
  let prev = await l.boundingBox();
  for (let i = 0; i < 20; i++) {
    await l.page().waitForTimeout(100);
    const next = await l.boundingBox();
    if (prev && next && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5) return next;
    prev = next;
  }
  return prev;
}

/** Drags from a node's output handle to another node's input handle, like a user wiring the diagram. */
async function connect(page: Page, from: Locator, to: Locator) {
  const src = await settledBox(from.locator(".react-flow__handle-right"));
  const dst = await settledBox(to.locator(".react-flow__handle-left"));
  if (!src || !dst) throw new Error("handle not found");
  await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
  await page.mouse.down();
  await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 12 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("a guest builds level 1 on the canvas and earns three stars", async ({ page }) => {
  await page.goto("/play/hello-server");
  await expect(page.getByRole("heading", { name: "Hello, Server" })).toBeVisible();
  await page.getByTestId("palette-app").click();
  await page.getByTestId("palette-sqldb").click();
  await expect(page.getByTestId("budget")).toContainText("40 / 60");

  await connect(page, node(page, "client"), node(page, "app"));
  await connect(page, node(page, "app"), node(page, "sqldb"));
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);

  const results = await runToResults(page);
  await expect(results).toContainText("Flawless. Three stars.");
  expect(await starsIn(page)).toBe(3);
  await expect(results).toContainText("No problems detected");
  await expect(results.getByRole("link", { name: "Save my progress" })).toBeVisible();
  await expect(results.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/learn/scale-out");
});

test("components can be dropped from the palette onto the canvas", async ({ page }) => {
  await page.goto("/play/hello-server");
  await page.getByTestId("palette-app").dragTo(page.locator(".react-flow__pane"), { targetPosition: { x: 200, y: 300 } });
  await expect(node(page, "app")).toHaveCount(1);
});

test("the credit budget is enforced", async ({ page }) => {
  await page.goto("/play/hello-server");
  await page.getByTestId("palette-sqldb").click();
  await page.getByTestId("palette-sqldb").click();
  await expect(page.getByTestId("budget")).toContainText("60 / 60");
  await page.getByTestId("palette-app").click();
  await expect(page.getByText("Over budget: that would cost 70 of 60 credits.")).toBeVisible();
  await expect(node(page, "app")).toHaveCount(0);
});

test("the inspector scales, connects and removes components", async ({ page }) => {
  await page.goto("/play/hello-server");
  await page.getByTestId("palette-app").click();
  const inspector = page.getByTestId("inspector");
  await expect(inspector).toContainText("App Server");
  await inspector.getByRole("button", { name: "Add one instance" }).click();
  await expect(inspector.getByTestId("instance-count")).toHaveText("2");
  await expect(page.getByTestId("budget")).toContainText("20 / 60");

  await page.getByTestId("palette-sqldb").click();
  await node(page, "app").click();
  await inspector.getByLabel("Connect to").selectOption({ label: await inspector.getByLabel("Connect to").locator("option").nth(1).innerText() });
  await inspector.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(inspector).toContainText("SQL Database");
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);

  await node(page, "sqldb").click();
  await page.getByTestId("inspector").getByRole("button", { name: "Remove component" }).click();
  await expect(node(page, "sqldb")).toHaveCount(0);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
});

test("a failing design gets a post-mortem that names the bottleneck", async ({ page }) => {
  await page.goto("/play/scale-out");
  const results = await runToResults(page);
  await expect(results).toContainText("It broke under load.");
  expect(await starsIn(page)).toBe(0);
  await expect(results.getByTestId("issues")).toContainText("App Server hit");
  await results.getByRole("button", { name: "Edit design" }).click();
  await expect(page.getByTestId("results")).toBeHidden();
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeVisible();
});

test("a lesson explains the topic and quizzes you before the canvas opens", async ({ page }) => {
  const article = getArticle("cache-the-hot-reads")!;
  await page.goto("/learn/cache-the-hot-reads");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cache the Hot Reads");
  for (const h of ["The big picture", "See it in motion", "Numbers to know", "In the real world", "In the interview", "Check yourself", ...article.sections.map((s) => s.heading)])
    await expect(page.getByRole("heading", { name: h })).toBeVisible();

  // The request walkthrough steps through each hop with its own narration.
  const walk = page.getByTestId("walkthrough").first();
  await walk.getByRole("button", { name: "Step 2:" }).click();
  await expect(walk.getByTestId("walkthrough-step")).toHaveText(article.diagrams[0].steps![1]);
  await walk.getByRole("button", { name: "Next step" }).click();
  await expect(walk.getByTestId("walkthrough-step")).toHaveText(article.diagrams[0].steps![2]);
  const motion = page.getByTestId(`concept-${TOPIC_CONCEPTS["cache-the-hot-reads"][0]}`);
  await expect(motion).toBeVisible();
  await motion.getByRole("button", { name: "Pause animation" }).click();
  await expect(motion.getByRole("button", { name: "Play animation" })).toBeVisible();

  const quiz = page.getByTestId("quiz");
  for (const q of article.quiz) await quiz.getByRole("button", { name: q.options[q.answer], exact: true }).click();
  await expect(page.getByTestId("quiz-score")).toContainText(`${article.quiz.length} of ${article.quiz.length} correct`);

  await page.getByRole("link", { name: "Start the challenge" }).first().click();
  await page.waitForURL("**/play/cache-the-hot-reads");
  await expect(page.getByText("4,000/s")).toBeVisible();
  await page.getByRole("button", { name: "Show hint 1 of 3" }).click();
  await expect(page.getByTestId("hint")).toHaveCount(1);
  await page.getByRole("tab", { name: "Recap" }).click();
  await page.getByRole("link", { name: "Read the full lesson" }).click();
  await page.waitForURL("**/learn/cache-the-hot-reads");
});

test("unsaved work is restored after a reload and can be reset", async ({ page }) => {
  await page.goto("/play/hello-server");
  await expect(page.getByTestId("playground")).toBeVisible();
  // Opening a level without touching it leaves no draft behind.
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => localStorage.getItem("sf:draft:hello-server"))).toBeNull();
  await page.reload();
  await expect(page.getByTestId("playground")).toBeVisible();
  await expect(page.getByText("Restored your unsaved draft")).toHaveCount(0);

  await page.getByTestId("palette-app").click();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByText("Restored your unsaved draft")).toBeVisible();
  await expect(node(page, "app")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(node(page, "app")).toHaveCount(0);
  await expect(page.getByText("Restored your unsaved draft")).toHaveCount(0);
});

test("Pro levels and later case-study stages are locked for guests", async ({ page }) => {
  await page.goto("/play/queue-the-writes");
  await expect(page.getByTestId("locked")).toContainText("System Sketch Lab Pro");
  await page.goto("/play/uber-2");
  await expect(page.getByTestId("locked")).toContainText("Sign in");
  // Pro lessons show a preview, never the full article or quiz.
  await page.goto("/learn/queue-the-writes");
  await expect(page.getByTestId("topic-locked")).toBeVisible();
  await expect(page.getByTestId("quiz")).toHaveCount(0);
  await expect(page.getByText(getArticle("queue-the-writes")!.mistakes[0])).toHaveCount(0);
});

test("the browser never receives a level's reference solution", async ({ page }) => {
  const solution = JSON.stringify(getLevel("hello-server")!.solution.edges);
  const res = await page.goto("/play/hello-server");
  const html = (await res?.text()) ?? "";
  expect(html).not.toContain(solution.replaceAll('"', '\\"'));
  expect(html).not.toContain(solution);
});
