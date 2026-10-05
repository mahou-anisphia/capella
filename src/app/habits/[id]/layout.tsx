import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { parseId } from "~/lib/route-params";
import { api } from "~/trpc/server";
import { HabitNav } from "./_components/habit-nav";

export default async function HabitLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const id = parseId((await params).id);
  const habit = id ? await api.habit.get({ id }) : null;
  if (!habit) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground -ml-1 flex w-fit items-center gap-0.5 text-sm"
        >
          <ChevronLeftIcon className="size-4" />
          All habits
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{habit.name}</h1>
      </div>
      <HabitNav id={habit.id} />
      {children}
    </div>
  );
}
