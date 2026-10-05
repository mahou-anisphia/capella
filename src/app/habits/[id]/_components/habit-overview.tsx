"use client";

import { PeriodBars } from "~/components/habit/period-bars";
import { formatShort } from "~/lib/dates";
import { plural } from "~/lib/format";
import { api } from "~/trpc/react";
import { PeriodHistory } from "./period-history";
import { StatTile } from "./stat-tile";
import { WeekdayChart } from "./weekday-chart";

export function HabitOverview({ id }: { id: number }) {
  const [habit] = api.habit.get.useSuspenseQuery({ id });
  if (!habit) return null;
  const s = habit.stats;
  const judged = s.hits + s.misses;

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Fortnights in a row" value={s.streak} />
        <StatTile label="Best run" value={s.bestStreak} />
        <StatTile
          label="Fortnights reached"
          value={judged > 0 ? `${s.hits} of ${judged}` : "–"}
        />
        <StatTile
          label="Average per fortnight"
          value={
            s.averagePerPeriod === null ? "–" : s.averagePerPeriod.toFixed(1)
          }
        />
        <StatTile
          label="Best fortnight"
          value={s.bestPeriod ? s.bestPeriod.count : "–"}
          caption={s.bestPeriod ? formatShort(s.bestPeriod.start) : undefined}
        />
        <StatTile label="Current target" value={s.currentTarget} />
      </section>

      <section className="bg-card ring-border shadow-surface flex flex-col gap-3 rounded-xl p-4 ring-1">
        <h2 className="text-base font-semibold">Recent fortnights</h2>
        <PeriodBars periods={s.periods.slice(-12)} />
      </section>

      <section className="bg-card ring-border shadow-surface flex flex-col gap-3 rounded-xl p-4 ring-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">Which days get used</h2>
          <p className="text-muted-foreground text-xs">
            {plural(s.liveCount, "live check-in")},{" "}
            {plural(s.backfilledCount, "backfilled check-in")}
          </p>
        </div>
        <WeekdayChart counts={s.weekdayCounts} />
      </section>

      <PeriodHistory habitId={habit.id} periods={s.periods} />
    </div>
  );
}
