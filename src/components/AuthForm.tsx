"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { Button } from "./ui";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dest = safeNext(next);
  const signup = mode === "signup";

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const email = String(f.get("email") ?? "").trim();
        const password = String(f.get("password") ?? "");
        setBusy(true);
        setError(null);
        const res = signup
          ? await authClient.signUp.email({ name: String(f.get("name") ?? "").trim(), email, password })
          : await authClient.signIn.email({ email, password });
        if (res.error) {
          setError(res.error.message ?? "Something went wrong.");
          setBusy(false);
          return;
        }
        router.push(dest);
        router.refresh();
      }}
    >
      {signup && <Field label="Name" name="name" autoComplete="name" required minLength={2} maxLength={40} />}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={8} hint={signup ? "At least 8 characters." : undefined} />
      {error && (
        <p role="alert" className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <Button type="submit" variant="accent" className="w-full py-3 text-base" disabled={busy}>
        {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        {signup ? "Already have an account? " : "New here? "}
        <Link href={`/${signup ? "login" : "signup"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-cobalt hover:underline">
          {signup ? "Sign in" : "Create a free account"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, hint, ...props }: { label: string; hint?: string } & React.ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input {...props} className="mt-1 block w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-cobalt" />
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}
