"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Test-mode only: lets testers return to the free plan. */
export function CancelPlanButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await fetch("/api/billing/cancel", { method: "POST" });
          setBusy(false);
          if (res.ok) router.refresh();
          else setError((await res.json()).error ?? "Could not cancel.");
        }}
        className="text-sm font-semibold text-bad hover:underline disabled:opacity-50"
      >
        {busy ? "Cancelling…" : "Cancel plan"}
      </button>
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  );
}
