"use client";

import { CheckIcon, MoonIcon, SunriseIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { formatRange } from "~/lib/dates";
import { type PeriodResult } from "~/lib/habit-stats";
import { SKIP_REASON_LABELS } from "~/lib/format";
import { skipReasonSchema } from "~/lib/validators";
import { api } from "~/trpc/react";

const REASON_ITEMS = [
  { value: "none", label: "No reason" },
  ...Object.entries(SKIP_REASON_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

function statusText(p: PeriodResult): string {
  if (p.status === "skipped") return "Resting";
  if (p.status === "hit") return `${p.count} of ${p.target}, reached`;
  if (p.status === "in-progress") return `${p.count} of ${p.target} so far`;
  return `${p.count} of ${p.target}`;
}

export function PeriodHistory({
  habitId,
  periods,
}: {
  habitId: number;
  periods: PeriodResult[];
}) {
  const utils = api.useUtils();
  const onError = (error: { message: string }) => toast(error.message);
  const onSettled = () => utils.invalidate();
  const skip = api.period.skip.useMutation({ onError, onSettled });
  const unskip = api.period.unskip.useMutation({ onError, onSettled });
  const busy = skip.isPending || unskip.isPending;

  return (
    <section className="bg-card ring-border shadow-surface flex flex-col rounded-xl ring-1">
      <div className="flex flex-col gap-0.5 p-4 pb-2">
        <h2 className="text-base font-semibold">Every fortnight</h2>
        <p className="text-muted-foreground text-xs">
          Resting fortnights don&apos;t count for or against the streak.
        </p>
      </div>
      <ul className="divide-border divide-y">
        {[...periods].reverse().map((p) => (
          <li
            key={p.start}
            className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center">
                {p.status === "hit" && (
                  <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full">
                    <CheckIcon className="size-3.5" aria-hidden />
                  </span>
                )}
                {p.status === "skipped" && (
                  <MoonIcon
                    className="text-muted-foreground size-4"
                    aria-hidden
                  />
                )}
                {(p.status === "miss" || p.status === "in-progress") && (
                  <span
                    className="bg-secondary size-3 rounded-full"
                    aria-hidden
                  />
                )}
              </span>
              <div className="flex flex-col">
                <span className="text-sm">
                  {formatRange(p.start, p.end)}
                  {p.isCurrent && (
                    <span className="text-muted-foreground"> · now</span>
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {statusText(p)}
                  {p.isPartial && " · first fortnight, not in streaks"}
                </span>
              </div>
            </div>

            {p.status === "skipped" ? (
              <div className="flex items-center gap-1">
                <Select
                  items={REASON_ITEMS}
                  value={p.skipReason ?? "none"}
                  onValueChange={(value) => {
                    const reason = skipReasonSchema.safeParse(value);
                    skip.mutate({
                      habitId,
                      periodStart: p.start,
                      reason: reason.success ? reason.data : null,
                    });
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Reason"
                    className="rounded-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground rounded-full"
                  disabled={busy}
                  onClick={() =>
                    unskip.mutate({ habitId, periodStart: p.start })
                  }
                >
                  <SunriseIcon />
                  Count it
                </Button>
              </div>
            ) : (
              p.status !== "hit" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground rounded-full"
                  disabled={busy}
                  onClick={() =>
                    skip.mutate({ habitId, periodStart: p.start, reason: null })
                  }
                >
                  <MoonIcon />
                  Mark as rest
                </Button>
              )
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
