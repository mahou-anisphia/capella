import { SparklesIcon } from "lucide-react";

import { plural } from "~/lib/format";
import { cn } from "~/lib/utils";

/** Shown only as a positive number; a broken streak simply disappears. */
export function StreakBadge({
  streak,
  bestStreak,
}: {
  streak: number;
  bestStreak: number;
}) {
  if (streak === 0) return null;
  const isBest = streak >= bestStreak;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-semibold tabular-nums">
          {streak}
        </span>
        <span className="text-muted-foreground text-xs">
          {streak === 1 ? "fortnight hit" : "fortnights in a row"}
        </span>
      </div>
      <span
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
          isBest ? "bg-accent/25" : "text-muted-foreground",
        )}
      >
        {isBest ? (
          <>
            <SparklesIcon className="size-3" aria-hidden />
            Best yet
          </>
        ) : (
          `Best: ${plural(bestStreak, "fortnight")}`
        )}
      </span>
    </div>
  );
}
