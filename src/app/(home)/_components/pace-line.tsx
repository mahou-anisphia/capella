import { addDays, formatLong } from "~/lib/dates";
import { type CurrentPeriod } from "~/lib/habit-stats";
import { plural } from "~/lib/format";

/**
 * Gentle, factual pace wording. Never "behind" or "failed": a tight fortnight gets a soft accent
 * tint, and an unreachable one points at the fresh start.
 */
export function PaceLine({ current }: { current: CurrentPeriod }) {
  const nextStart = formatLong(addDays(current.end, 1));
  const daysLeft =
    current.daysLeft === 1 ? "Last day" : `${current.daysLeft} days left`;

  switch (current.pace) {
    case "resting":
      return (
        <Lines
          main="Resting this fortnight."
          caption={`A fresh one starts ${nextStart}.`}
        />
      );
    case "done":
      return (
        <Lines
          main="Target reached for this fortnight."
          caption="Anything more is a bonus."
        />
      );
    case "out-of-reach":
      return (
        <Lines
          main="A lighter fortnight, and that's okay."
          caption={`Every check-in still counts. A fresh one starts ${nextStart}.`}
        />
      );
    case "tight":
      return (
        <div className="bg-accent/20 rounded-lg px-3 py-2 text-sm">
          <p className="font-medium">
            {current.remaining} more in the next{" "}
            {plural(current.openDays, "day")}.
          </p>
          <p>Tight on time, but it fits.</p>
        </div>
      );
    case "behind":
      return (
        <Lines
          main={
            <>
              {daysLeft}, <strong>need {current.remaining} more</strong>
            </>
          }
          caption={`Even pace would be ${current.evenPace} by today. Plenty of room to catch up.`}
        />
      );
    case "on-pace":
      return (
        <Lines
          main={
            <>
              {daysLeft}, <strong>need {current.remaining} more</strong>
            </>
          }
          caption="Right on pace."
        />
      );
  }
}

function Lines({ main, caption }: { main: React.ReactNode; caption: string }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <p className="[&_strong]:font-semibold">{main}</p>
      <p className="text-muted-foreground">{caption}</p>
    </div>
  );
}
