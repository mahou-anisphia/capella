import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { PeriodBars } from "~/components/habit/period-bars";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "~/components/ui/card";
import { type RouterOutputs } from "~/trpc/react";
import { CheckInActions } from "./check-in-actions";
import { PaceLine } from "./pace-line";
import { ProgressRing } from "./progress-ring";
import { StreakBadge } from "./streak-badge";

type HabitView = RouterOutputs["habit"]["list"][number];

export function HabitCard({ habit }: { habit: HabitView }) {
  const { current, periods, streak, bestStreak } = habit.stats;

  return (
    <Card className="ring-border shadow-surface gap-5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <Link
            href={`/habits/${habit.id}`}
            className="group focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-md outline-none hover:underline focus-visible:ring-3"
          >
            {habit.name}
            <ChevronRightIcon className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </CardTitle>
        <CardAction>
          <StreakBadge streak={streak} bestStreak={bestStreak} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            count={current.count}
            target={current.target}
            elapsedDays={current.elapsedDays}
            evenPace={current.evenPace}
          />
          <PaceLine current={current} />
        </div>
        <CheckInActions habitId={habit.id} current={current} />
        <PeriodBars periods={periods.slice(-8)} />
      </CardContent>
    </Card>
  );
}
