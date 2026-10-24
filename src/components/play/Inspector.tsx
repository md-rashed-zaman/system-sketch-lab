"use client";

import type { Edge } from "@xyflow/react";
import { ArrowRight, Cable, CircleDollarSign, Copy, Info, Minus, MousePointerClick, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { COMPONENTS } from "@/engine/components";
import type { ComponentType } from "@/engine/types";
import type { ComponentNodeT } from "./ComponentNode";
import { ICONS, TINT } from "./icons";

interface Props {
  node: ComponentNodeT | null;
  nodes: ComponentNodeT[];
  edges: Edge[];
  locked: boolean;
  palette: ComponentType[];
  onInstances: (id: string, n: number) => void;
  onRemove: (id: string) => void;
  onConnect: (source: string, target: string) => void;
  onRemoveEdge: (source: string, target: string) => void;
}

const label = (n: ComponentNodeT) => COMPONENTS[n.data.type].label;

export function Inspector({ node, nodes, edges, locked, palette, onInstances, onRemove, onConnect, onRemoveEdge }: Props) {
  const [target, setTarget] = useState("");

  if (!node)
    return (
      <aside className="hidden overflow-y-auto bg-paper px-5 py-5 text-sm lg:block" aria-label="Inspector">
        <h2 className="text-lg font-semibold tracking-tight">Inspector</h2>
        <p className="mt-2 flex gap-2 text-ink-soft">
          <MousePointerClick size={16} className="mt-0.5 shrink-0" /> Select a component on the canvas to change its instances, connect it, or remove it.
        </p>
        <h3 className="mt-6 text-xs font-semibold text-ink-soft">Available here</h3>
        <ul className="mt-3 space-y-3">
          {palette.map((t) => {
            const Icon = ICONS[t];
            const spec = COMPONENTS[t];
            return (
              <li key={t} className="flex gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, ${TINT[t]} 18%, transparent)`, color: TINT[t] }}>
                  <Icon size={16} />
                </span>
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {spec.label}
                    <span className="inline-flex items-center gap-0.5 font-mono text-xs font-normal text-ink-soft">
                      <CircleDollarSign size={13} /> {spec.cost}
                    </span>
                  </p>
                  <p className="text-xs text-ink-soft">{spec.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
    );

  const spec = COMPONENTS[node.data.type];
  const Icon = ICONS[node.data.type];
  const isClient = node.data.type === "client";
  const outgoing = edges.filter((e) => e.source === node.id);
  const candidates = nodes.filter((n) => n.id !== node.id && n.data.type !== "client" && !outgoing.some((e) => e.target === n.id));

  return (
    <aside className="overflow-y-auto border-t border-line bg-paper px-5 py-5 text-sm lg:border-t-0" aria-label="Inspector" data-testid="inspector">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${TINT[node.data.type]} 18%, transparent)`, color: TINT[node.data.type] }}>
          <Icon size={21} />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight tracking-tight">{spec.label}</h2>
          {!isClient && (
            <p className="inline-flex items-center gap-1 font-mono text-xs text-ink-soft">
              <CircleDollarSign size={13} /> {spec.cost} each
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 flex gap-2 text-ink-soft">
        <Info size={15} className="mt-0.5 shrink-0" /> {spec.description}
      </p>

      {!isClient && (
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <Copy size={13} /> {node.data.type === "nosql" ? "Shards" : "Instances"}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              aria-label="Remove one instance"
              disabled={locked || node.data.instances <= 1}
              onClick={() => onInstances(node.id, node.data.instances - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card hover:bg-paper-2 disabled:opacity-40"
            >
              <Minus size={15} />
            </button>
            <output className="w-12 text-center font-mono text-xl font-semibold tabular" data-testid="instance-count">
              {node.data.instances}
            </output>
            <button
              type="button"
              aria-label="Add one instance"
              disabled={locked || node.data.instances >= spec.maxInstances}
              onClick={() => onInstances(node.id, node.data.instances + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card hover:bg-paper-2 disabled:opacity-40"
            >
              <Plus size={15} />
            </button>
            <span className="ml-2 inline-flex items-center gap-1 font-mono text-xs text-ink-soft" title={`Up to ${spec.maxInstances}`}>
              <CircleDollarSign size={13} /> {spec.cost * node.data.instances} · max {spec.maxInstances}
            </span>
          </div>
          {spec.standby && node.data.instances > 1 && <p className="mt-2 text-xs text-cobalt">Second instance is a hot standby: survives a crash, adds no capacity.</p>}
        </div>
      )}

      <div className="mt-6">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Cable size={13} /> Sends traffic to
        </p>
        <ul className="mt-2 space-y-1.5">
          {outgoing.length === 0 && <li className="text-xs text-ink-soft">Nothing yet.</li>}
          {outgoing.map((e) => {
            const t = nodes.find((n) => n.id === e.target);
            if (!t) return null;
            return (
              <li key={e.id} className="flex items-center justify-between rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs">
                <span className="flex items-center gap-1.5">
                  <ArrowRight size={12} /> {label(t)}
                </span>
                {!locked && (
                  <button type="button" aria-label={`Disconnect ${label(t)}`} onClick={() => onRemoveEdge(node.id, t.id)} className="text-ink-soft hover:text-bad">
                    <X size={13} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {!locked && candidates.length > 0 && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (target) onConnect(node.id, target);
              setTarget("");
            }}
          >
            <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Connect to" className="min-w-0 flex-1 rounded-lg border border-line bg-card px-2 py-1.5 text-xs">
              <option value="">Connect to…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {label(c)} ({c.id})
                </option>
              ))}
            </select>
            <button type="submit" disabled={!target} className="rounded-lg bg-ink px-3 text-xs font-semibold text-paper disabled:opacity-40">
              Connect
            </button>
          </form>
        )}
      </div>

      {!isClient && !locked && (
        <button
          type="button"
          onClick={() => onRemove(node.id)}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-bad/40 py-2 text-sm font-semibold text-bad hover:bg-bad/5"
        >
          <Trash2 size={14} /> Remove component
        </button>
      )}
    </aside>
  );
}
