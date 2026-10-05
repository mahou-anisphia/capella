"use client";

import { CheckCheckIcon, CheckIcon, MoonIcon, SunriseIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { type CurrentPeriod } from "~/lib/habit-stats";
import { api } from "~/trpc/react";

export function CheckInActions({
  habitId,
  current,
}: {
  habitId: number;
  current: CurrentPeriod;
}) {
  const utils = api.useUtils();
  const onError = (error: { message: string }) => toast(error.message);
  const onSettled = () => utils.invalidate();

  const checkIn = api.checkIn.today.useMutation({ onError, onSettled });
  const undo = api.checkIn.undoToday.useMutation({ onError, onSettled });
  const rest = api.period.skip.useMutation({
    onError,
    onSettled,
    onSuccess: () => toast("Resting this fortnight. Enjoy it."),
  });
  const resume = api.period.unskip.useMutation({ onError, onSettled });
  const busy =
    checkIn.isPending || undo.isPending || rest.isPending || resume.isPending;

  return (
    <div className="flex flex-col gap-2">
      {current.checkedInToday ? (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled
            className="h-12 flex-1 rounded-full text-base disabled:opacity-100"
          >
            <CheckCheckIcon className="size-5" />
            Done for today
          </Button>
          <Button
            variant="ghost"
            className="h-12 rounded-full"
            disabled={busy}
            onClick={() => undo.mutate({ habitId })}
          >
            Undo
          </Button>
        </div>
      ) : (
        <Button
          className="h-12 w-full rounded-full text-base"
          disabled={busy}
          onClick={() => checkIn.mutate({ habitId })}
        >
          <CheckIcon className="size-5" />
          {checkIn.isPending ? "Checking in…" : "Check in today"}
        </Button>
      )}
      <div className="flex justify-center">
        {current.status === "skipped" ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full"
            disabled={busy}
            onClick={() =>
              resume.mutate({ habitId, periodStart: current.start })
            }
          >
            <SunriseIcon />
            Count this fortnight again
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full"
            disabled={busy}
            onClick={() =>
              rest.mutate({ habitId, periodStart: current.start, reason: null })
            }
          >
            <MoonIcon />
            Rest this fortnight
          </Button>
        )}
      </div>
    </div>
  );
}
