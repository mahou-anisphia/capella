"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppCalendar } from "~/components/date/app-calendar";
import { Button } from "~/components/ui/button";
import { formatLong, isoToLocalDate, localDateToISO } from "~/lib/dates";
import { plural } from "~/lib/format";
import { api } from "~/trpc/react";

/**
 * Tap days on and off, then save once. Selected days are the check-ins; the diff against what's
 * stored becomes one add/remove request.
 */
export function BulkCalendar({ habitId }: { habitId: number }) {
  const [habit] = api.habit.get.useSuspenseQuery({ id: habitId });
  const [checkIns] = api.checkIn.list.useSuspenseQuery({ habitId });
  const saved = useMemo(() => checkIns.map((c) => c.date), [checkIns]);
  if (!habit) return null;

  // Remount on every saved change so the draft resets to what's stored.
  return (
    <CalendarDraft
      key={saved.join()}
      habitId={habitId}
      saved={saved}
      notedDates={checkIns.filter((c) => c.note).map((c) => c.date)}
      today={habit.stats.today}
      startDate={habit.startDate}
    />
  );
}

function CalendarDraft({
  habitId,
  saved,
  notedDates,
  today,
  startDate,
}: {
  habitId: number;
  saved: string[];
  notedDates: string[];
  today: string;
  startDate: string;
}) {
  const utils = api.useUtils();
  const [selected, setSelected] = useState<Date[]>(() =>
    saved.map(isoToLocalDate),
  );

  const selectedIso = new Set(selected.map(localDateToISO));
  const savedSet = new Set(saved);
  const add = [...selectedIso].filter((d) => !savedSet.has(d));
  const remove = saved.filter((d) => !selectedIso.has(d));
  const removingNotes = remove.filter((d) => notedDates.includes(d)).length;
  const dirty = add.length > 0 || remove.length > 0;
  const newStart = [...add].sort()[0];
  const movesStart = newStart !== undefined && newStart < startDate;

  const sync = api.checkIn.sync.useMutation({
    onSuccess: () => toast("Saved."),
    onError: (error) => toast(error.message),
    onSettled: () => utils.invalidate(),
  });

  return (
    <section className="bg-card ring-border shadow-surface flex flex-col gap-3 rounded-xl p-4 ring-1">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">Fill in past days</h2>
        <p className="text-muted-foreground text-xs">
          Tap any days you did it, then save. Days before tracking started move
          the start back. Past fortnights are judged by the target in effect
          then, which you can set in{" "}
          <Link
            href={`/habits/${habitId}/settings`}
            className="text-foreground underline underline-offset-2"
          >
            settings
          </Link>
          .
        </p>
      </div>
      <AppCalendar
        mode="multiple"
        todayIso={today}
        selected={selected}
        onSelect={(days) => setSelected(days ?? [])}
        defaultMonth={isoToLocalDate(today)}
        className="mx-auto [--cell-size:--spacing(10)]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {dirty
            ? [
                add.length > 0 && `Add ${plural(add.length, "day")}`,
                remove.length > 0 && `remove ${plural(remove.length, "day")}`,
              ]
                .filter(Boolean)
                .join(", ") +
              (removingNotes > 0
                ? ` (${plural(removingNotes, "note")} will go too)`
                : "")
            : "No changes."}
          {movesStart && ` Tracking will start from ${formatLong(newStart)}.`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            disabled={!dirty || sync.isPending}
            onClick={() => setSelected(saved.map(isoToLocalDate))}
          >
            Reset
          </Button>
          <Button
            className="rounded-full px-4"
            disabled={!dirty || sync.isPending}
            onClick={() => sync.mutate({ habitId, add, remove })}
          >
            {sync.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </section>
  );
}
