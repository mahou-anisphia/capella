import { WEEKDAY_LABELS } from "~/lib/dates";

/** Single-series bars, Monday first, with the count on each so nothing relies on bar height. */
export function WeekdayChart({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);

  return (
    <figure className="flex flex-col gap-1">
      <div className="flex h-24 items-end gap-0.5" aria-hidden>
        {counts.map((n, i) => (
          <div
            key={WEEKDAY_LABELS[i]}
            title={`${WEEKDAY_LABELS[i]}: ${n}`}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >
            <span className="text-muted-foreground mb-0.5 text-[0.7rem] tabular-nums">
              {n}
            </span>
            <div
              className="bg-accent w-full max-w-8 rounded-t-[4px]"
              style={{ height: n > 0 ? `${(n / max) * 100}%` : "2px" }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5" aria-hidden>
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-muted-foreground flex-1 text-center text-[0.7rem]"
          >
            {label}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">
        {WEEKDAY_LABELS.map((label, i) => `${label}: ${counts[i]}`).join(", ")}
      </figcaption>
    </figure>
  );
}
