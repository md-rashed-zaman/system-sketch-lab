import { Check } from "lucide-react";
import type { Metadata } from "next";
import { PLANS, type PaidPlan } from "@/lib/billing";
import { getViewer } from "@/lib/session";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "Pricing", description: "Free core path. Pro from $9/month for every chapter and case study." };

const FREE = ["Chapters 1-3 (9 levels)", "How Uber works case study (5 stages)", "Daily challenge and leaderboards", "Sandbox", "XP, streaks and badges"];
const PRO = ["Everything in Free", "Chapters 4-6: async, protection, real-time and the boss level", "WhatsApp, Netflix and X/Twitter case studies", "Every future chapter, case study and incident replay", "Support an independent project"];

export default async function PricingPage() {
  const viewer = await getViewer();
  const href = (plan: PaidPlan) => (viewer ? `/checkout?plan=${plan}` : `/signup?next=${encodeURIComponent(`/checkout?plan=${plan}`)}`);
  return (
    <div className="paper-grid flex-1">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Start free. Go Pro when you are <em>hooked.</em></h1>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">Regional discounts apply automatically at checkout in many countries.</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-card p-6">
            <h2 className="text-xl font-semibold tracking-tight">Free</h2>
            <p className="mt-3 text-4xl font-semibold tracking-tight">$0</p>
            <p className="text-sm text-ink-soft">forever</p>
            <Features items={FREE} />
            <LinkButton href={viewer ? "/learn" : "/signup"} variant="outline" className="mt-6 w-full">
              {viewer ? "Go to the path" : "Create free account"}
            </LinkButton>
          </div>
          {(Object.keys(PLANS) as PaidPlan[]).map((p) => {
            const plan = PLANS[p];
            const current = viewer?.profile.plan === p;
            return (
              <div key={p} className={`relative rounded-2xl border bg-card p-6 ${p === "yearly" ? "border-signal shadow-[var(--shadow)] ring-1 ring-signal" : "border-line"}`} data-testid={`plan-${p}`}>
                {p === "yearly" && (
                  <span className="absolute -top-3 left-6 rounded-full bg-signal px-3 py-0.5 text-xs font-bold text-white">Most popular</span>
                )}
                <h2 className="text-xl font-semibold tracking-tight">{plan.label}</h2>
                <p className="mt-3 text-4xl font-semibold tracking-tight">{plan.price}</p>
                <p className="text-sm text-ink-soft">
                  {plan.cadence} · {plan.note}
                </p>
                <Features items={PRO} />
                {current ? (
                  <p className="mt-6 rounded-lg border border-line py-2.5 text-center text-sm font-semibold">Your current plan</p>
                ) : (
                  <LinkButton href={href(p)} variant="accent" className="mt-6 w-full">
                    Choose {plan.label.replace("Pro ", "")}
                  </LinkButton>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-ink-soft">Payments are processed by our merchant of record, which handles VAT and sales tax. Cancel any time from your profile.</p>
      </div>
    </div>
  );
}

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 text-sm">
      {items.map((f) => (
        <li key={f} className="flex gap-2">
          <Check size={16} className="mt-0.5 shrink-0 text-ok" /> {f}
        </li>
      ))}
    </ul>
  );
}
