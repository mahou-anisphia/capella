import { Suspense } from "react";

import { api, HydrateClient } from "~/trpc/server";
import { HabitList } from "./_components/habit-list";
import { HabitListSkeleton } from "./_components/habit-list-skeleton";

export default async function HomePage() {
  void api.habit.list.prefetch();

  return (
    <HydrateClient>
      <Suspense fallback={<HabitListSkeleton />}>
        <HabitList />
      </Suspense>
    </HydrateClient>
  );
}
