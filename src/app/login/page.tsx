import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/safe-next";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getViewer()) redirect(safeNext(next));
  return (
    <div className="paper-grid flex flex-1 items-start justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-line bg-card p-8 ink-shadow">
        <h1 className="text-3xl">Welcome <em>back.</em></h1>
        <p className="mt-1 text-ink-soft">Pick up where your last outage left off.</p>
        <div className="mt-6">
          <AuthForm mode="login" next={next} />
        </div>
      </div>
    </div>
  );
}
