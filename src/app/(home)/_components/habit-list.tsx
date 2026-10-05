"use client";

import { PlusIcon, SproutIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { HabitCard } from "./habit-card";

export function HabitList() {
  const [habits] = api.habit.list.useSuspenseQuery();

  if (habits.length === 0) {
    return (
      <div className="bg-card ring-border shadow-surface flex flex-col items-center gap-4 rounded-xl px-6 py-12 text-center ring-1">
        <SproutIcon className="text-accent size-10" aria-hidden />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Nothing tracked yet</h1>
          <p className="text-muted-foreground text-sm">
            Pick one habit and a fortnightly target to start.
          </p>
        </div>
        <Link
          href="/habits/new"
          className={cn(buttonVariants(), "h-10 rounded-full px-5")}
        >
          <PlusIcon />
          Start a habit
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Your habits</h1>
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
      <Link
        href="/habits/new"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "text-muted-foreground self-center rounded-full",
        )}
      >
        <PlusIcon />
        Add another habit
      </Link>
    </div>
  );
}
