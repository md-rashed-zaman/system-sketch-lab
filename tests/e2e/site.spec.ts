import { expect, test } from "@playwright/test";

test("the landing page explains the product and starts level 1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Learn system design by");
  await expect(page.getByRole("img", { name: /Animated architecture/ })).toBeVisible();
  await page.getByRole("link", { name: /Start learning free/ }).click();
  await page.waitForURL("**/learn/hello-server");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Server");
  await page.getByRole("link", { name: "Start the challenge" }).first().click();
  await page.waitForURL("**/play/hello-server");
  await expect(page.getByTestId("playground")).toBeVisible();
});

test("main navigation reaches every section", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const [label, heading] of [
    ["Learn", "From one server to planet scale."],
    ["Case studies", "Build the systems you use every day."],
    ["Leaderboard", "Leaderboard"],
    ["Pricing", "Start free. Go Pro when you are hooked."],
  ] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
});

test("unknown pages render the 404 page", async ({ page }) => {
  const res = await page.goto("/definitely-not-here");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page is down." })).toBeVisible();
});

test("public pages have no horizontal scroll on phones and tablets", async ({ page }) => {
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["/", "/learn", "/learn/scale-out", "/case-studies", "/case-studies/uber", "/daily", "/pricing", "/leaderboard", "/login", "/signup"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("phones get a navigation menu", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/learn");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Pricing" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Start free. Go Pro when you are hooked.");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
});

test("the playground fits a laptop screen with every panel in view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const path of ["/sandbox", "/play/hello-server"]) {
    await page.goto(path);
    await expect(page.getByTestId("playground")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
    await expect(page.getByRole("button", { name: "Run simulation" })).toBeInViewport();
    await expect(page.getByRole("heading", { name: "Inspector" })).toBeInViewport();
  }
});

test("the dark theme toggle switches and is remembered", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/learn", { waitUntil: "networkidle" });
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Toggle dark theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(14, 16, 20)");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("a dark system setting is followed until the visitor picks a theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
