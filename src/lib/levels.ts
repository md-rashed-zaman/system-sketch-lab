import { getLevel } from "@/content";
import { dailyLevel, isValidDate, todayUtc } from "@/content/daily";
import type { Level } from "@/content/types";

/** Resolves lesson, case-study and daily ids. Daily levels exist only for today and past days. */
export function resolveLevel(id: string, today = todayUtc()): Level | undefined {
  if (id.startsWith("daily-")) {
    const date = id.slice("daily-".length);
    if (!isValidDate(date) || date > today) return undefined;
    return dailyLevel(date);
  }
  return getLevel(id);
}
