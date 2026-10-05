"use client";

import { Calendar } from "~/components/ui/calendar";
import { isoToLocalDate, type ISODate } from "~/lib/dates";
import { cn } from "~/lib/utils";

/**
 * The one calendar used everywhere (date pickers and bulk logging): Monday first, month/year
 * dropdowns for quick backfilling, and no future days. `todayIso` comes from the server so it
 * follows the app timezone, not the browser's.
 */
export function AppCalendar({
  todayIso,
  className,
  ...props
}: React.ComponentProps<typeof Calendar> & { todayIso: ISODate }) {
  const todayDate = isoToLocalDate(todayIso);

  return (
    <Calendar
      weekStartsOn={1}
      today={todayDate}
      captionLayout="dropdown"
      startMonth={new Date(todayDate.getFullYear() - 10, 0)}
      endMonth={todayDate}
      disabled={{ after: todayDate }}
      className={cn("bg-transparent p-0 [--cell-size:--spacing(9)]", className)}
      {...props}
    />
  );
}
