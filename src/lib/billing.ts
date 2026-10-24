import crypto from "node:crypto";
import { db, nowIso } from "./db";
import { setPlan, type Plan } from "./progress";

export type PaidPlan = Exclude<Plan, "free">;

export const PLANS: Record<PaidPlan, { label: string; price: string; cadence: string; note: string }> = {
  monthly: { label: "Pro Monthly", price: "$9", cadence: "per month", note: "Cancel any time" },
  yearly: { label: "Pro Yearly", price: "$59", cadence: "per year", note: "Save 45% vs monthly" },
  lifetime: { label: "Pro Lifetime", price: "$149", cadence: "once", note: "Every future chapter and case study" },
};

export const isPaidPlan = (p: unknown): p is PaidPlan => p === "monthly" || p === "yearly" || p === "lifetime";

export const paymentsMode = () => (process.env.PAYMENTS_MODE === "live" ? "live" : "test");

function logEvent(id: string, kind: string, userId: string | null, payload: unknown): boolean {
  const res = db()
    .prepare("insert or ignore into billing_events (id, kind, user_id, payload, created_at) values (?, ?, ?, ?, ?)")
    .run(id, kind, userId, JSON.stringify(payload), nowIso());
  return res.changes > 0;
}

/** Test mode only: completes a fake checkout instantly so the whole flow can be exercised without a payment provider. */
export function completeTestCheckout(userId: string, plan: PaidPlan) {
  if (paymentsMode() !== "test") throw new Error("Test checkout is disabled in live mode.");
  logEvent(`test_${crypto.randomUUID()}`, "test_checkout", userId, { plan });
  setPlan(userId, plan, "test");
}

export function cancelTestPlan(userId: string) {
  if (paymentsMode() !== "test") throw new Error("Test cancellation is disabled in live mode.");
  logEvent(`test_${crypto.randomUUID()}`, "test_cancel", userId, {});
  setPlan(userId, "free", "test");
}

/** Live mode: creates a Lemon Squeezy checkout carrying our user id in custom data. */
export async function createLiveCheckout(userId: string, email: string, plan: PaidPlan): Promise<string> {
  const variant = process.env[`LEMONSQUEEZY_VARIANT_${plan.toUpperCase()}`];
  const { LEMONSQUEEZY_API_KEY: key, LEMONSQUEEZY_STORE_ID: store, NEXT_PUBLIC_APP_URL: appUrl } = process.env;
  if (!variant || !key || !store) throw new Error("Lemon Squeezy is not configured.");
  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: { Accept: "application/vnd.api+json", "Content-Type": "application/vnd.api+json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: { email, custom: { user_id: userId, plan } },
          product_options: { redirect_url: `${appUrl}/billing/success` },
        },
        relationships: { store: { data: { type: "stores", id: store } }, variant: { data: { type: "variants", id: variant } } },
      },
    }),
  });
  if (!res.ok) throw new Error(`Checkout failed (${res.status}).`);
  const json = (await res.json()) as { data: { attributes: { url: string } } };
  return json.data.attributes.url;
}

/** Constant-time check of Lemon Squeezy's X-Signature header (hex HMAC-SHA256 of the raw body). */
export function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

interface WebhookPayload {
  meta?: { event_name?: string; custom_data?: { user_id?: string; plan?: string } };
  data?: { id?: string; attributes?: { status?: string } };
}

/** Applies a verified webhook. Idempotent: a replayed event id is ignored. Returns what changed. */
export function handleWebhook(payload: WebhookPayload): { applied: boolean; plan?: Plan } {
  const event = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  const plan = payload.meta?.custom_data?.plan;
  const id = `${event}_${payload.data?.id}_${payload.data?.attributes?.status ?? ""}`;
  if (!event || !userId || !logEvent(id, event, userId, payload)) return { applied: false };
  const status = payload.data?.attributes?.status;
  if ((event === "order_created" || event === "subscription_created" || event === "subscription_resumed") && isPaidPlan(plan)) {
    setPlan(userId, plan, "lemonsqueezy");
    return { applied: true, plan };
  }
  if (event === "subscription_updated" && isPaidPlan(plan)) {
    const active = status === "active" || status === "on_trial" || status === "past_due";
    setPlan(userId, active ? plan : "free", "lemonsqueezy");
    return { applied: true, plan: active ? plan : "free" };
  }
  if (event === "subscription_expired" || event === "order_refunded") {
    setPlan(userId, "free", "lemonsqueezy");
    return { applied: true, plan: "free" };
  }
  return { applied: false };
}
