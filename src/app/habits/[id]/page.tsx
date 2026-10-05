import { notFound } from "next/navigation";

import { parseId } from "~/lib/route-params";
import { api, HydrateClient } from "~/trpc/server";
import { HabitOverview } from "./_components/habit-overview";

export default async function HabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseId((await params).id);
  if (!id) notFound();
  void api.habit.get.prefetch({ id });

  return (
    <HydrateClient>
      <HabitOverview id={id} />
    </HydrateClient>
  );
}
