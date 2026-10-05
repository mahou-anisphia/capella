"use client";

import { useRouter } from "next/navigation";
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
import { api } from "~/trpc/react";

export function DeleteHabit({ id }: { id: number }) {
  const [habit] = api.habit.get.useSuspenseQuery({ id });
  const router = useRouter();
  const utils = api.useUtils();
  const remove = api.habit.delete.useMutation({
    onSuccess: async () => {
      router.push("/");
      await utils.habit.list.invalidate();
    },
    onError: (error) => toast(error.message),
  });

  if (!habit) return null;

  return (
    <section className="flex flex-col items-start gap-2 px-1">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="destructive" className="rounded-full px-4" />
          }
        >
          Delete habit
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {habit.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every check-in, target and rest fortnight for it. It
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
