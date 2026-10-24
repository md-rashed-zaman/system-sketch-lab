import { expect, type Page } from "@playwright/test";
import type { Design } from "@/engine/types";

let counter = 0;
export const uniqueEmail = (prefix: string) => `${prefix}.${Date.now()}.${counter++}@example.test`;

export async function signUp(page: Page, name: string, next?: string) {
  const email = uniqueEmail(name.toLowerCase().replace(/\s+/g, ""));
  await page.goto(next ? `/signup?next=${encodeURIComponent(next)}` : "/signup");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(next ? `**${next.split("?")[0]}**` : "**/learn");
  return { email, password: "correct-horse-battery" };
}

/** Opens a level with a specific design by seeding the local draft, exactly like a returning player's unsaved work. */
export async function openWithDesign(page: Page, levelId: string, design: Design) {
  await page.goto(`/play/${levelId}`);
  await expect(page.getByTestId("playground")).toBeVisible();
  await page.evaluate(([id, d]) => localStorage.setItem(`sf:draft:${id}`, JSON.stringify(d)), [levelId, design] as const);
  await page.reload();
  await expect(page.getByTestId("playground")).toBeVisible();
  await expect(page.getByText("Restored your unsaved draft")).toBeVisible();
}

export async function runToResults(page: Page) {
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByTestId("live-hud")).toBeVisible();
  await page.getByRole("button", { name: "Skip to results" }).click();
  const results = page.getByTestId("results");
  await expect(results).toBeVisible();
  return results;
}

export async function starsIn(page: Page) {
  const label = await page.getByTestId("results").getByRole("img", { name: /of 3 stars/ }).getAttribute("aria-label");
  return Number(label?.split(" ")[0]);
}
