import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { parseId } from "~/lib/route-params";
import { api, HydrateClient } from "~/trpc/server";
import { BulkCalendar } from "./_components/bulk-calendar";
import { CheckInList } from "./_components/check-in-list";

export const metadata: Metadata = { title: "Log" };

export default async function HabitLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseId((await params).id);
  if (!id) notFound();
  void api.habit.get.prefetch({ id });
  void api.checkIn.list.prefetch({ habitId: id });

  return (
    <HydrateClient>
      <div className="flex flex-col gap-4">
        <BulkCalendar habitId={id} />
        <CheckInList habitId={id} />
      </div>
    </HydrateClient>
  );
}
