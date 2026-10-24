import { expect, test } from "@playwright/test";
import { getLevel } from "@/content";
import { openWithDesign, runToResults, signUp, starsIn } from "./helpers";

test("free users can buy Pro in test mode, unlocking Pro levels and case studies, then cancel", async ({ page }) => {
  await signUp(page, "Ada Lovelace");
  await page.goto("/play/queue-the-writes");
  await expect(page.getByTestId("locked")).toBeVisible();
  await page.goto("/case-studies/whatsapp");
  await expect(page.getByRole("link", { name: "Unlock with Pro" })).toBeVisible();

  await page.goto("/pricing");
  await page.getByTestId("plan-yearly").getByRole("link", { name: /Choose/ }).click();
  await expect(page.getByTestId("test-mode")).toBeVisible();
  await page.getByRole("button", { name: "Complete test purchase" }).click();
  await page.waitForURL("**/billing/success**");
  await expect(page.getByRole("heading", { name: "You are Pro." })).toBeVisible();

  const level = getLevel("queue-the-writes")!;
  await openWithDesign(page, level.id, level.solution);
  await runToResults(page);
  expect(await starsIn(page)).toBe(3);

  await page.goto("/case-studies/whatsapp");
  await expect(page.getByTestId("stage-whatsapp-1").getByRole("link", { name: "Read" })).toBeVisible();
  await page.goto("/case-studies/whatsapp/1");
  await expect(page.getByTestId("quiz")).toBeVisible();
  await page.goto("/pricing");
  await expect(page.getByTestId("plan-yearly")).toContainText("Your current plan");

  await page.goto("/profile");
  await expect(page.getByTestId("plan")).toContainText("Pro Yearly");
  await page.getByRole("button", { name: "Cancel plan" }).click();
  await expect(page.getByTestId("plan")).toContainText("Free");
  await page.goto("/play/queue-the-writes");
  await expect(page.getByTestId("locked")).toBeVisible();
});

test("guests choosing a plan are sent to sign up first, then back to checkout", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByTestId("plan-monthly").getByRole("link", { name: /Choose/ }).click();
  await expect(page).toHaveURL(/\/signup\?next=%2Fcheckout%3Fplan%3Dmonthly/);
  await page.getByLabel("Name").fill("Margaret");
  await page.getByLabel("Email").fill(`margaret.${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/checkout?plan=monthly");
  await expect(page.getByRole("heading", { name: "Pro Monthly" })).toBeVisible();
});

test("the Uber case study unlocks stage by stage and carries the design forward", async ({ page }) => {
  await signUp(page, "Travis");
  await page.goto("/case-studies/uber/2");
  await expect(page.getByRole("link", { name: "Finish stage 1 first" }).first()).toBeVisible();

  const s1 = getLevel("uber-1")!;
  await openWithDesign(page, s1.id, s1.solution);
  const results = await runToResults(page);
  expect(await starsIn(page)).toBe(3);
  await results.getByRole("link", { name: /Next/ }).click();
  // The next stage opens on its explanation, then the canvas.
  await page.waitForURL("**/case-studies/uber/2");
  await page.getByRole("link", { name: "Start the challenge" }).first().click();
  await page.waitForURL("**/play/uber-2");
  await expect(page.getByRole("heading", { name: "Drivers stream their location" })).toBeVisible();
  // Stage 2 starts from the design the player built in stage 1.
  await expect(page.getByTestId("node-app")).toHaveCount(1);
  await expect(page.getByTestId("node-sqldb")).toHaveCount(1);
  await expect(page.getByTestId("node-ws")).toHaveCount(0);

  await page.goto("/case-studies/uber");
  await expect(page.getByTestId("stage-uber-1").getByRole("link", { name: "Replay" })).toBeVisible();
});
