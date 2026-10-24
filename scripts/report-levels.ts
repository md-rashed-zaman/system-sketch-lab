/** Content-author tool: prints how each level's starting design and reference solution score. `pnpm levels:report` */
import { ALL_LEVELS } from "@/content";
import { evaluate } from "@/engine/scoring";
import { designCredits, simulate } from "@/engine/simulate";

const only = process.argv[2];
for (const level of ALL_LEVELS) {
  if (only && !level.id.includes(only)) continue;
  for (const [label, d] of [["start", level.start], ["solution", level.solution]] as const) {
    const r = simulate(d, level.scenario);
    const e = evaluate(level.objectives, level.stretch, r);
    const peaks = Object.entries(r.peakUtil)
      .map(([id, p]) => `${id}:${Number.isFinite(p.u) ? p.u.toFixed(2) : "down"}`)
      .join(" ");
    console.log(
      `${level.id.padEnd(30)} ${label.padEnd(8)} stars=${e.stars} avail=${(r.availability * 100).toFixed(2)}% p95=${r.p95.toFixed(0)}ms credits=${designCredits(d)}/${level.budget} lag=${r.maxLagSec.toFixed(0)} failAv=${(r.failureAvailability * 100).toFixed(2)}% | ${peaks}`,
    );
    if (label === "solution" && e.stars < 3) for (const c of [...e.checks, ...e.starChecks]) if (!c.met) console.log(`    missed: ${c.label} (got ${c.actual})`);
    if (label === "start" && e.stars > 0) console.log("    WARNING: starting design already passes");
  }
}
