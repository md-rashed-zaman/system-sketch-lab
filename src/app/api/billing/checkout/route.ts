import { NextResponse } from "next/server";
import { completeTestCheckout, createLiveCheckout, isPaidPlan, paymentsMode } from "@/lib/billing";
import { getViewer } from "@/lib/session";

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { plan } = (await req.json().catch(() => ({}))) as { plan?: unknown };
  if (!isPaidPlan(plan)) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  if (paymentsMode() === "test") {
    completeTestCheckout(viewer.id, plan);
    return NextResponse.json({ url: `/billing/success?plan=${plan}` });
  }
  try {
    return NextResponse.json({ url: await createLiveCheckout(viewer.id, viewer.email, plan) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
