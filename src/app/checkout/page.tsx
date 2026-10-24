import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isPaidPlan, paymentsMode, PLANS } from "@/lib/billing";
import { getViewer } from "@/lib/session";
import { CheckoutButton } from "@/components/CheckoutButton";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/checkout?plan=${plan ?? "yearly"}`)}`);
  if (!isPaidPlan(plan)) redirect("/pricing");
  const p = PLANS[plan];
  const test = paymentsMode() === "test";

  return (
    <div className="paper-grid flex-1">
      <div className="mx-auto max-w-lg px-4 py-14">
        <div className="rounded-xl border border-line bg-card p-8 ink-shadow">
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-2 text-3xl">{p.label}</h1>
          <div className="mt-6 flex items-baseline justify-between border-y border-line py-4">
            <span>Total</span>
            <span className="text-3xl font-semibold tracking-tight">
              {p.price} <span className="text-sm font-normal text-ink-soft">{p.cadence}</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Account: {viewer.email}</p>
          {test && (
            <p className="mt-4 rounded-md border-2 border-dashed border-warn bg-warn/10 px-3 py-2 text-sm" data-testid="test-mode">
              <b>Test mode.</b> No payment is taken: completing this checkout unlocks Pro instantly so the full flow can be tested.
            </p>
          )}
          <CheckoutButton plan={plan} label={test ? "Complete test purchase" : `Pay ${p.price}`} />
        </div>
      </div>
    </div>
  );
}
