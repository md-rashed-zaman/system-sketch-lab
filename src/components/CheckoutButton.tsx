"use client";

import { useState } from "react";
import { Button } from "./ui";

export function CheckoutButton({ plan, label }: { plan: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        variant="accent"
        className="mt-6 w-full py-3 text-base"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
          const json = await res.json();
          if (res.ok) window.location.assign(json.url);
          else {
            setError(json.error ?? "Checkout failed.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Processing…" : label}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}
    </>
  );
}
