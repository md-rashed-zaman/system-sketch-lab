"use client";

import clsx from "clsx";
import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Article } from "@/content/types";

export function Quiz({ quiz }: { quiz: Article["quiz"] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => quiz.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p === quiz[i].answer).length;

  return (
    <div className="space-y-5" data-testid="quiz">
      {quiz.map((q, qi) => {
        const choice = picked[qi];
        return (
          <fieldset key={q.question} className="rounded-xl border border-line bg-card p-5">
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="font-medium">
              <span className="mr-2 text-ink-soft">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="mt-4 grid gap-2">
              {q.options.map((o, oi) => {
                const isAnswer = oi === q.answer;
                const state = choice === null ? "idle" : isAnswer ? "right" : choice === oi ? "wrong" : "dim";
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={choice !== null}
                    onClick={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      state === "idle" && "border-line hover:border-cobalt hover:bg-cobalt-soft",
                      state === "right" && "border-ok/50 bg-ok/10",
                      state === "wrong" && "border-bad/50 bg-bad/10",
                      state === "dim" && "border-line opacity-55",
                    )}
                  >
                    {state === "right" ? (
                      <CircleCheck size={18} className="shrink-0 text-ok" />
                    ) : state === "wrong" ? (
                      <CircleX size={18} className="shrink-0 text-bad" />
                    ) : (
                      <span className="h-[18px] w-[18px] shrink-0 rounded-full border border-ink-soft/50" />
                    )}
                    {o}
                  </button>
                );
              })}
            </div>
            {choice !== null && (
              <p className={clsx("mt-4 rounded-lg px-4 py-3 text-sm", choice === q.answer ? "bg-ok/10 text-ink-2" : "bg-paper-2 text-ink-2")} role="status">
                <b className={choice === q.answer ? "text-ok" : "text-bad"}>{choice === q.answer ? "Correct. " : "Not quite. "}</b>
                {q.explain}
              </p>
            )}
          </fieldset>
        );
      })}
      {answered === quiz.length && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper-2 px-5 py-4">
          <p className="font-medium" data-testid="quiz-score">
            {correct} of {quiz.length} correct{correct === quiz.length ? ". You are ready for the challenge." : ". Reread the sections above, then try again."}
          </p>
          <button
            type="button"
            onClick={() => setPicked(quiz.map(() => null))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-cobalt hover:underline"
          >
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      )}
    </div>
  );
}
