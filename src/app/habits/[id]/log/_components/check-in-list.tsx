"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { formatLong } from "~/lib/dates";
import { api, type RouterOutputs } from "~/trpc/react";
import { CheckInEditForm } from "./check-in-edit-form";

type CheckIn = RouterOutputs["checkIn"]["list"][number];

const PAGE_SIZE = 30;

export function CheckInList({ habitId }: { habitId: number }) {
  const [checkIns] = api.checkIn.list.useSuspenseQuery({ habitId });
  const [habit] = api.habit.get.useSuspenseQuery({ id: habitId });
  const [shown, setShown] = useState(PAGE_SIZE);
  if (!habit) return null;

  return (
    <section className="bg-card ring-border shadow-surface flex flex-col rounded-xl ring-1">
      <h2 className="p-4 pb-2 text-base font-semibold">
        All check-ins{" "}
        <span className="text-muted-foreground font-normal">
          ({checkIns.length})
        </span>
      </h2>
      {checkIns.length === 0 ? (
        <p className="text-muted-foreground px-4 pb-4 text-sm">
          None yet. They&apos;ll show up here.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {checkIns.slice(0, shown).map((c) => (
            <CheckInRow key={c.id} checkIn={c} today={habit.stats.today} />
          ))}
        </ul>
      )}
      {checkIns.length > shown && (
        <Button
          variant="ghost"
          className="text-muted-foreground m-2 rounded-full"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
        >
          Show more
        </Button>
      )}
    </section>
  );
}

function CheckInRow({ checkIn, today }: { checkIn: CheckIn; today: string }) {
  const [editing, setEditing] = useState(false);
  const utils = api.useUtils();
  const remove = api.checkIn.delete.useMutation({
    onError: (error) => toast(error.message),
    onSettled: () => utils.invalidate(),
  });

  if (editing) {
    return (
      <li className="px-4 py-3">
        <CheckInEditForm
          checkIn={checkIn}
          today={today}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-2 px-4 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm">
          {formatLong(checkIn.date)}
          {checkIn.backfilled && (
            <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[0.7rem]">
              backfilled
            </span>
          )}
        </span>
        {checkIn.note && (
          <p className="text-muted-foreground text-sm break-words whitespace-pre-line">
            {checkIn.note}
          </p>
        )}
      </div>
      <div className="flex shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Edit ${formatLong(checkIn.date)}`}
          onClick={() => setEditing(true)}
        >
          <PencilIcon />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label={`Delete ${formatLong(checkIn.date)}`}
              />
            }
          >
            <Trash2Icon />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this check-in?</AlertDialogTitle>
              <AlertDialogDescription>
                {formatLong(checkIn.date)}
                {checkIn.note ? ", along with its note." : "."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">
                Keep
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-full"
                onClick={() => remove.mutate({ id: checkIn.id })}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
