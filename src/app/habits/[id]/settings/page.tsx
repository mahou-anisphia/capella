import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { parseId } from "~/lib/route-params";
import { api, HydrateClient } from "~/trpc/server";
import { DeleteHabit } from "./_components/delete-habit";
import { HabitDetailsForm } from "./_components/habit-details-form";
import { TargetHistory } from "./_components/target-history";

export const metadata: Metadata = { title: "Settings" };

export default async function HabitSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseId((await params).id);
  if (!id) notFound();
  void api.habit.get.prefetch({ id });

  return (
    <HydrateClient>
      <div className="flex flex-col gap-4">
        <HabitDetailsForm id={id} />
        <TargetHistory id={id} />
        <DeleteHabit id={id} />
      </div>
    </HydrateClient>
  );
}
