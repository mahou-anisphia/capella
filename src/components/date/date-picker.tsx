"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { AppCalendar } from "~/components/date/app-calendar";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  formatLong,
  isoToLocalDate,
  isValidISODate,
  localDateToISO,
  type ISODate,
} from "~/lib/dates";
import { cn } from "~/lib/utils";

/** A single-date field: a button showing the date that opens {@link AppCalendar}. */
export function DatePicker({
  id,
  value,
  onChange,
  today,
  invalid,
  className,
}: {
  id?: string;
  value: ISODate;
  onChange: (value: ISODate) => void;
  today: ISODate;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = isValidISODate(value) ? isoToLocalDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            className={cn("h-9 w-52 justify-start font-normal", className)}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" />
        {selected ? (
          formatLong(value)
        ) : (
          <span className="text-muted-foreground">Pick a date</span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="ring-border shadow-surface w-auto rounded-xl p-3"
      >
        <AppCalendar
          mode="single"
          todayIso={today}
          selected={selected}
          defaultMonth={selected ?? isoToLocalDate(today)}
          onSelect={(date) => {
            if (!date) return;
            onChange(localDateToISO(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
