import { NextResponse } from "next/server";
import { RunError, submitRun } from "@/lib/progress";
import { getViewer } from "@/lib/session";

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in to save your progress." }, { status: 401 });
  let body: { levelId?: unknown; design?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (typeof body.levelId !== "string") return NextResponse.json({ error: "levelId is required." }, { status: 400 });
  try {
    return NextResponse.json(submitRun(viewer.id, body.levelId, body.design));
  } catch (e) {
    if (e instanceof RunError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
    throw e;
  }
}
