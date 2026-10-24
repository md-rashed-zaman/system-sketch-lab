"use client";

import dynamic from "next/dynamic";

/** The canvas measures the DOM and reads local drafts, so it renders in the browser only. */
export const PlaygroundClient = dynamic(() => import("./Playground").then((m) => m.Playground), {
  ssr: false,
  loading: () => (
    <div className="blueprint flex h-[calc(100dvh-4rem)] items-center justify-center gap-2 text-sm text-ink-soft" data-testid="playground-loading">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-signal" aria-hidden /> Loading the canvas…
    </div>
  ),
});
