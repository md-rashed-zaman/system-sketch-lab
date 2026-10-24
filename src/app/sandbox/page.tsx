import type { Metadata } from "next";
import { PlaygroundClient as Playground } from "@/components/play/PlaygroundClient";
import type { Level } from "@/content/types";
import { PLACEABLE } from "@/engine/components";
import { design } from "@/engine/design";

export const metadata: Metadata = { title: "Sandbox", description: "Free-form system design canvas with live traffic simulation." };

const SANDBOX: Level = {
  id: "sandbox",
  kind: "lesson",
  title: "Sandbox",
  tagline: "Any components, any traffic. Break whatever you like.",
  concept: { intro: "", points: [], tradeoffs: [], interviewTip: "" },
  brief: "",
  palette: PLACEABLE,
  start: design([["lb", "lb"], ["app", "app", 2], ["cache", "cache"], ["db", "sqldb"]], ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"]),
  scenario: { traffic: { read: 2000, write: 200 }, curve: "wave" },
  budget: 100_000,
  objectives: { minAvailability: 0.99, maxP95: 150 },
  stretch: [],
  hints: [],
  solution: design([], []),
  pro: false,
  xpPerStar: 0,
};

export default function SandboxPage() {
  return <Playground level={SANDBOX} initialDesign={SANDBOX.start} signedIn={false} bestStars={0} backHref="/learn" backLabel="Learning path" sandbox />;
}
