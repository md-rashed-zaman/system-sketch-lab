import { describe, expect, it } from "vitest";
import { COMPONENTS } from "@/engine/components";
import { evaluate } from "@/engine/scoring";
import { simulate, validateDesign } from "@/engine/simulate";
import { autoSolve, dailyLevel, dayNumber, isValidDate, shareText } from "./daily";
import { TOPIC_CONCEPTS } from "./concepts";
import { ALL_LEVELS, CASE_STUDIES, CHAPTERS, getArticle, getLevel, nextLevel } from "./index";

describe("content", () => {
  it("has unique level ids", () => {
    const ids = ALL_LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps chapters 1-3 free and the rest Pro, Uber free and other case studies Pro", () => {
    expect(CHAPTERS.map((c) => c.pro)).toEqual([false, false, false, true, true, true]);
    for (const c of CHAPTERS) for (const l of c.levels) expect(l.pro).toBe(c.pro);
    expect(CASE_STUDIES.filter((c) => !c.pro).map((c) => c.slug)).toEqual(["uber"]);
  });

  describe.each(ALL_LEVELS.map((l) => [l.id, l] as const))("%s", (_id, level) => {
    it("is complete", () => {
      expect(level.hints).toHaveLength(3);
      expect(level.concept.intro.length).toBeGreaterThan(50);
      expect(level.concept.points.length).toBeGreaterThanOrEqual(3);
      expect(level.stretch).toHaveLength(2);
      for (const t of level.palette) expect(COMPONENTS[t]).toBeDefined();
    });

    it("has a full article to read before playing", () => {
      const a = getArticle(level.id)!;
      expect(a).toBeDefined();
      expect(a.sections.length).toBeGreaterThanOrEqual(3);
      expect(a.diagrams.length).toBeGreaterThanOrEqual(1);
      for (const d of a.diagrams) {
        for (const n of d.nodes) expect(COMPONENTS[n]).toBeDefined();
        expect(d.steps?.length, d.title).toBe(d.nodes.length);
      }
      expect(a.quiz.length).toBeGreaterThanOrEqual(2);
      expect(TOPIC_CONCEPTS[level.id]?.length, "animated concept").toBeGreaterThanOrEqual(1);
      for (const q of a.quiz) expect(q.options[q.answer]).toBeDefined();
      expect(JSON.stringify(a)).not.toMatch(/[\u2013\u2014]/);
    });

    it("has a valid reference solution that earns three stars", () => {
      expect(validateDesign(level.solution, { palette: level.palette, budget: level.budget })).toEqual([]);
      const e = evaluate(level.objectives, level.stretch, simulate(level.solution, level.scenario));
      expect(e.stars).toBe(3);
    });

    it("starts from a design that does not pass yet", () => {
      expect(validateDesign(level.start, { palette: level.palette })).toEqual([]);
      const e = evaluate(level.objectives, level.stretch, simulate(level.start, level.scenario));
      expect(e.passed).toBe(false);
    });
  });

  it("chains case-study stages: each stage starts from the previous reference solution", () => {
    for (const cs of CASE_STUDIES)
      cs.stages.forEach((s, i) => {
        expect(s.caseStudy).toEqual({ slug: cs.slug, stage: i + 1 });
        if (i > 0) expect(s.start).toEqual(cs.stages[i - 1].solution);
      });
  });

  it("finds levels and their successors", () => {
    expect(getLevel("hello-server")?.title).toBe("Hello, Server");
    expect(nextLevel("hello-server")?.id).toBe("scale-out");
    expect(nextLevel("uber-1")?.id).toBe("uber-2");
    expect(nextLevel("uber-5")).toBeUndefined();
    expect(nextLevel("black-friday")).toBeUndefined();
  });
});

describe("daily challenge", () => {
  it("numbers days from 1 Jan 2026 and validates dates", () => {
    expect(dayNumber("2026-01-01")).toBe(1);
    expect(dayNumber("2026-10-24")).toBe(297);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2025-12-31")).toBe(false);
    expect(isValidDate("2026-10-24")).toBe(true);
    expect(isValidDate("not-a-date")).toBe(false);
  });

  it("is deterministic per date", () => {
    expect(dailyLevel("2026-10-24")).toEqual(dailyLevel("2026-10-24"));
    expect(dailyLevel("2026-10-24").scenario).not.toEqual(dailyLevel("2026-10-25").scenario);
  });

  it("is always solvable within its budget for 120 consecutive days", () => {
    const start = Date.UTC(2026, 9, 1);
    for (let i = 0; i < 120; i++) {
      const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      const level = dailyLevel(date);
      expect(validateDesign(level.solution, { palette: level.palette, budget: level.budget }), date).toEqual([]);
      const e = evaluate(level.objectives, level.stretch, simulate(level.solution, level.scenario));
      expect(e.stars, `${date} ${level.title}`).toBe(3);
    }
  });

  it("auto-solver leaves the design untouched when it already passes comfortably", () => {
    const level = getLevel("hello-server")!;
    expect(autoSolve(level.solution, level.scenario)).toEqual(level.solution);
  });

  it("builds a spoiler-free share text", () => {
    expect(shareText("2026-10-24", 2, 120, 61.4, "https://x.test/daily")).toBe(
      "System Sketch Lab Daily #297 ⭐⭐▫️\n120 credits · p95 61 ms\nhttps://x.test/daily",
    );
  });
});
