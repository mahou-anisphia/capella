import { CheckIcon, MoonIcon } from "lucide-react";

import { formatRange, formatShort } from "~/lib/dates";
import { type PeriodResult } from "~/lib/habit-stats";
import { cn } from "~/lib/utils";

function describe(p: PeriodResult): string {
  const range = formatRange(p.start, p.end);
  const tally = `${p.count} of ${p.target}`;
  switch (p.status) {
    case "hit":
      return `${range}: ${tally}, reached`;
    case "miss":
      return `${range}: ${tally}`;
    case "skipped":
      return `${range}: resting`;
    case "in-progress":
      return `${range}: ${tally} so far`;
  }
}

/**
 * Count-vs-target bars, one per fortnight. Hit = primary, miss = secondary, rest = dashed outline.
 * Each bar also carries an icon or label so the state never depends on hue alone.
 */
export function PeriodBars({
  periods,
  className,
}: {
  periods: PeriodResult[];
  className?: string;
}) {
  const scale = Math.max(1, ...periods.flatMap((p) => [p.count, p.target]));
  const pct = (n: number) => `${(n / scale) * 100}%`;

  return (
    <figure className={cn("flex flex-col gap-1", className)}>
      <div className="flex h-24 items-end gap-0.5" aria-hidden>
        {periods.map((p) => (
          <div
            key={p.start}
            title={describe(p)}
            className="relative flex h-full flex-1 flex-col items-center justify-end"
          >
            {/* Target marker */}
            {p.status !== "skipped" && (
              <div
                className="border-foreground/35 absolute inset-x-1 border-t border-dashed"
                style={{ bottom: pct(p.target) }}
              />
            )}
            <span className="text-muted-foreground mb-0.5 text-[0.7rem] tabular-nums">
              {p.status === "skipped" ? "" : p.count}
            </span>
            <div
              className={cn(
                "w-full max-w-7 rounded-t-[4px]",
                p.status === "hit" && "bg-primary",
                p.status === "miss" && "bg-secondary",
                p.status === "in-progress" && "bg-primary/45",
                p.status === "skipped" &&
                  "border-muted-foreground/50 h-full rounded-[4px] border border-dashed",
              )}
              style={
                p.status === "skipped"
                  ? undefined
                  : { height: p.count > 0 ? pct(p.count) : "2px" }
              }
            />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5" aria-hidden>
        {periods.map((p) => (
          <div
            key={p.start}
            className="text-muted-foreground flex flex-1 flex-col items-center gap-0.5 text-[0.65rem] leading-none"
          >
            <span className="flex h-3.5 items-center">
              {p.status === "hit" && (
                <CheckIcon className="text-foreground size-3.5" />
              )}
              {p.status === "skipped" && <MoonIcon className="size-3" />}
              {p.status === "in-progress" && (
                <span className="text-foreground font-medium">now</span>
              )}
            </span>
            <span className="whitespace-nowrap">{formatShort(p.start)}</span>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">
        <ul>
          {periods.map((p) => (
            <li key={p.start}>{describe(p)}</li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
