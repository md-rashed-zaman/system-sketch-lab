"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { Activity, CircleDollarSign, Copy, Flame, PowerOff, Radio } from "lucide-react";
import { memo } from "react";
import { COMPONENTS } from "@/engine/components";
import type { ComponentType } from "@/engine/types";
import { ICONS, TINT, utilColor } from "./icons";

export interface ComponentNodeData extends Record<string, unknown> {
  type: ComponentType;
  instances: number;
  util?: number;
  load?: number;
  down?: boolean;
  running?: boolean;
}

export type ComponentNodeT = Node<ComponentNodeData, "component">;

const fmtLoad = (x: number) => (x >= 10_000 ? `${(x / 1000).toFixed(0)}k` : x >= 1000 ? `${(x / 1000).toFixed(1)}k` : `${Math.round(x)}`);

const RING = 2 * Math.PI * 21;

function ComponentNodeImpl({ data, selected }: NodeProps<ComponentNodeT>) {
  const spec = COMPONENTS[data.type];
  const Icon = ICONS[data.type];
  const isClient = data.type === "client";
  const color = utilColor(data.util, data.down);
  const pct = data.util === undefined || !Number.isFinite(data.util) ? 0 : Math.min(1, data.util);
  const live = data.running && !isClient;
  const overload = live && !data.down && (data.util ?? 0) > 1;
  return (
    <div
      className={clsx(
        "relative w-[176px] rounded-xl border bg-card text-left text-ink shadow-sm transition-[box-shadow,border-color]",
        selected ? "border-signal ring-2 ring-signal/30" : overload ? "border-[#ef4444]" : "border-line",
        data.down && "opacity-60",
      )}
      data-testid={`node-${data.type}`}
      data-util={data.util === undefined ? "" : Number.isFinite(data.util) ? data.util.toFixed(2) : "down"}
      title={spec.description}
    >
      {!isClient && <Handle type="target" position={Position.Left} aria-label={`${spec.label} input`} />}
      <div className="flex items-center gap-3 p-2.5">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          {live && (
            <svg viewBox="0 0 46 46" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="23" cy="23" r="21" fill="none" stroke="var(--line)" strokeWidth="3" />
              <circle
                cx="23"
                cy="23"
                r="21"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - pct)}
                className="transition-[stroke-dashoffset] duration-100"
              />
            </svg>
          )}
          <span
            className={clsx("flex items-center justify-center rounded-lg", live ? "h-8 w-8" : "h-10 w-10")}
            style={{ background: `color-mix(in oklab, ${TINT[data.type]} 18%, transparent)`, color: TINT[data.type] }}
          >
            {data.down ? <PowerOff size={17} className="text-ink-soft" /> : <Icon size={live ? 16 : 19} strokeWidth={2} />}
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight">{spec.label}</p>
          <div className="mt-1 flex items-center gap-2.5 font-mono text-[11px] text-ink-soft">
            {isClient ? (
              <span className="inline-flex items-center gap-1" title="Traffic source">
                <Radio size={12} /> source
              </span>
            ) : live ? (
              <>
                <span className="inline-flex items-center gap-1 font-semibold" style={{ color }} title="Utilisation">
                  {data.down ? "down" : overload ? <Flame size={12} /> : null}
                  {!data.down && `${Math.round((data.util ?? 0) * 100)}%`}
                </span>
                <span className="inline-flex items-center gap-1" title="Requests per second">
                  <Activity size={12} /> {fmtLoad(data.load ?? 0)}
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1" title={data.type === "nosql" ? "Shards" : "Instances"}>
                  <Copy size={12} /> {data.instances}
                </span>
                <span className="inline-flex items-center gap-1" title="Credits">
                  <CircleDollarSign size={13} /> {spec.cost * data.instances}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} aria-label={`${spec.label} output`} />
    </div>
  );
}

export const ComponentNode = memo(ComponentNodeImpl);
