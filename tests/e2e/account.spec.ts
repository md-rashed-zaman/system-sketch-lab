import { expect, test } from "@playwright/test";
import { getLevel } from "@/content";
import { openWithDesign, runToResults, signUp } from "./helpers";

test("sign up, earn XP and badges, see progress everywhere, sign out and back in", async ({ page }) => {
  const creds = await signUp(page, "Grace Hopper");
  await expect(page.getByTestId("xp-chip")).toContainText("0 XP");

  await openWithDesign(page, "hello-server", getLevel("hello-server")!.solution);
  const results = await runToResults(page);
  await expect(results.getByTestId("xp-result")).toContainText("+150 XP");
  await expect(results.getByTestId("new-badges")).toContainText("First Deploy");
  await expect(results.getByTestId("new-badges")).toContainText("Triple Star");
  // The header and brief update in place, without a reload.
  await expect(page.getByTestId("xp-chip")).toContainText("150 XP");
  await expect(page.getByText("Your best")).toBeVisible();

  // Replaying the same result pays nothing new.
  await results.getByRole("button", { name: "Run again" }).click();
  await page.getByRole("button", { name: "Skip to results" }).click();
  await expect(page.getByTestId("xp-result")).toContainText("No new XP");

  await page.goto("/learn");
  await expect(page.getByTestId("xp-chip")).toContainText("150 XP");
  await expect(page.getByTestId("level-card-hello-server").getByRole("img", { name: "3 of 3 stars" })).toBeVisible();
  await expect(page.getByTestId("path-progress")).toContainText("1/18");

  await page.goto("/profile");
  await expect(page.getByTestId("profile-xp")).toHaveText("150");
  await expect(page.getByTestId("badges").locator('[data-earned="yes"]')).toHaveCount(3);
  await expect(page.getByTestId("recent-runs")).toContainText("Hello, Server");

  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/learn");
  await expect(page.getByTestId("xp-chip")).toContainText("150 XP");
});

test("wrong passwords are rejected with a message", async ({ page }) => {
  const creds = await signUp(page, "Linus");
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("profile requires sign-in and login redirects only to local paths", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)profile$/);
  await page.goto(`/signup?next=${encodeURIComponent("//evil.example.com")}`);
  await page.getByLabel("Name").fill("Barbara");
  await page.getByLabel("Email").fill(`barbara.${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/learn");
  await expect(page).toHaveURL(/^http:\/\/localhost:3200\/learn$/);
});
