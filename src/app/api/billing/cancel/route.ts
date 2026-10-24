import { NextResponse } from "next/server";
import { cancelTestPlan, paymentsMode } from "@/lib/billing";
import { getViewer } from "@/lib/session";

/** Test mode only; live subscriptions are managed in the Lemon Squeezy customer portal. */
export async function POST() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (paymentsMode() !== "test") return NextResponse.json({ error: "Manage your subscription from the billing portal." }, { status: 400 });
  cancelTestPlan(viewer.id);
  return NextResponse.json({ ok: true });
}
