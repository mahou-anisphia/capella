import { type Metadata } from "next";

import { todayInAppZone } from "~/lib/dates";
import { CreateHabitForm } from "./_components/create-habit-form";

export const metadata: Metadata = { title: "New habit" };

export default function NewHabitPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">New habit</h1>
        <p className="text-muted-foreground text-sm">
          Targets are per fortnight, so a missed day can be made up later.
        </p>
      </div>
      <CreateHabitForm today={todayInAppZone()} />
    </div>
  );
}
