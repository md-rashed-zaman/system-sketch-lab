import type { Metadata } from "next";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "Welcome to Pro" };

export default function SuccessPage() {
  return (
    <div className="paper-grid flex-1">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 text-4xl">You are <em>Pro.</em></h1>
        <p className="mt-3 text-ink-soft">Chapters 4-6 and every premium case study are unlocked. Go break something.</p>
        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href="/play/queue-the-writes" variant="accent">
            Start chapter 4
          </LinkButton>
          <LinkButton href="/case-studies" variant="outline">
            Case studies
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
