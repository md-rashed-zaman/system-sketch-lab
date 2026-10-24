import { NextResponse } from "next/server";
import { handleWebhook, verifySignature } from "@/lib/billing";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-signature"), process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? ""))
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  try {
    return NextResponse.json(handleWebhook(JSON.parse(raw)));
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
}
