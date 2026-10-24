import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  database: db(),
  appName: "System Sketch Lab",
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  session: { expiresIn: 60 * 60 * 24 * 30 },
  // The end-to-end suite signs up dozens of users from one IP; production keeps the limiter.
  rateLimit: { enabled: process.env.AUTH_RATE_LIMIT !== "off" },
  plugins: [nextCookies()],
});
