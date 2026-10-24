import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/safe-next";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getViewer()) redirect(safeNext(next));
  return (
    <div className="paper-grid flex flex-1 items-start justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-line bg-card p-8 ink-shadow">
        <h1 className="text-3xl">Start <em>breaking</em> things.</h1>
        <p className="mt-1 text-ink-soft">Free account: save stars, earn XP, keep a streak and join the leaderboard.</p>
        <div className="mt-6">
          <AuthForm mode="signup" next={next} />
        </div>
      </div>
    </div>
  );
}
