import type { ComponentType, Design } from "./types";

export const CLIENT_ID = "users";

type NodeSpec = [id: string, type: ComponentType, instances?: number];

/** Compact design builder: `design([["app", "app", 3]], ["users>app"])`. Users is added automatically. */
export function design(nodes: NodeSpec[], edges: string[]): Design {
  const all: NodeSpec[] = [[CLIENT_ID, "client", 1], ...nodes];
  return layout({
    nodes: all.map(([id, type, instances]) => ({ id, type, instances: instances ?? 1 })),
    edges: edges.map((e) => {
      const [from, to] = e.split(">");
      return { from, to };
    }),
  });
}

/** Layered left-to-right layout by distance from Users; keeps positions that are already set. */
export function layout(d: Design): Design {
  const depth = new Map<string, number>([[CLIENT_ID, 0]]);
  const queue = [CLIENT_ID];
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of d.edges)
      if (e.from === id && !depth.has(e.to)) {
        depth.set(e.to, depth.get(id)! + 1);
        queue.push(e.to);
      }
  }
  const maxDepth = Math.max(0, ...depth.values());
  const rows = new Map<number, number>();
  return {
    edges: d.edges,
    nodes: d.nodes.map((n) => {
      if (n.x !== undefined && n.y !== undefined) return n;
      const col = depth.get(n.id) ?? maxDepth + 1;
      const row = rows.get(col) ?? 0;
      rows.set(col, row + 1);
      return { ...n, x: 40 + col * 230, y: 60 + row * 150 };
    }),
  };
}
