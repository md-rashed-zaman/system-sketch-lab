"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Article } from "@/content/types";
import { COMPONENTS } from "@/engine/components";
import { ICONS, TINT } from "../play/icons";

const STEP_MS = 2800;

export function FlowWalkthrough({ title, nodes, caption, steps }: Article["diagrams"][number]) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with a browser preference read once on mount
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % nodes.length), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, active, nodes.length]);

  // On narrow screens the row scrolls sideways: keep the active step centred (without scrolling the page).
  useEffect(() => {
    const box = row.current;
    const el = box?.querySelector<HTMLElement>('[aria-current="step"]');
    if (box && el && box.scrollWidth > box.clientWidth) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const go = (i: number) => {
    setActive((i + nodes.length) % nodes.length);
    setPlaying(false);
  };
  const type = nodes[active];

  return (
    <figure className="overflow-hidden rounded-2xl border border-line" data-testid="walkthrough">
      <div className="blueprint px-4 pb-8 pt-5">
        <p className="text-xs font-medium text-ink-soft">{title}</p>
        <div ref={row} className="relative -mx-4 mt-6 overflow-x-auto px-4 pb-1">
        <ol className="mx-auto flex w-max items-start pt-1.5">
          {nodes.map((n, i) => {
            const Icon = ICONS[n];
            return (
              <li key={`${n}${i}`} className="flex items-start">
                {i > 0 && (
                  <span className="relative mx-1 mt-[26px] block h-0.5 w-8 rounded-full bg-[var(--edge)] opacity-60 sm:w-12" aria-hidden>
                    {i === active && <span key={active} className="packet absolute -top-[3px] h-2 w-2 rounded-full bg-signal" />}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => go(i)}
                  className={clsx("flex w-[76px] flex-col items-center gap-2 text-center transition-opacity", i > active && "opacity-55")}
                  aria-label={`Step ${i + 1}: ${COMPONENTS[n].label}`}
                  aria-current={i === active ? "step" : undefined}
                >
                  <span
                    className={clsx(
                      "flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm transition-all duration-300",
                      i === active ? "scale-110 border-signal ring-4 ring-signal/15" : "border-line",
                    )}
                    style={{ color: TINT[n] }}
                  >
                    <Icon size={24} />
                  </span>
                  <span className={clsx("text-xs leading-tight", i === active ? "font-semibold text-ink" : "text-ink-soft")}>{COMPONENTS[n].short}</span>
                </button>
              </li>
            );
          })}
        </ol>
        </div>
      </div>
      <div className="border-t border-line bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, ${TINT[type]} 18%, transparent)`, color: TINT[type] }}>
            {(() => {
              const Icon = ICONS[type];
              return <Icon size={16} />;
            })()}
          </span>
          <p className="min-w-0 flex-1 text-sm font-semibold">
            <span className="text-ink-soft">
              Step {active + 1} of {nodes.length} ·{" "}
            </span>
            {COMPONENTS[type].label}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => go(active - 1)} aria-label="Previous step" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-2 hover:text-ink">
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:text-ink"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button type="button" onClick={() => go(active + 1)} aria-label="Next step" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-2 hover:text-ink">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
        <p className="mt-3 min-h-[3.5rem] text-[15px] leading-7 text-ink-2" aria-live="polite" data-testid="walkthrough-step">
          {steps?.[active] ?? COMPONENTS[type].description}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {nodes.map((_, i) => (
            <span key={i} className={clsx("h-1 flex-1 rounded-full transition-colors", i <= active ? "bg-signal" : "bg-paper-3")} />
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-soft">{caption}</p>
      </div>
    </figure>
  );
}
