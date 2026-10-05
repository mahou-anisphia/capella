import "server-only";

import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";

import { todayInAppZone, type ISODate } from "~/lib/dates";
import { computeHabitStats } from "~/lib/habit-stats";
import { type db as Db } from "~/server/db";
import { habits } from "~/server/db/schema";

type Database = typeof Db;

/** Habit with everything the stats need, loaded in one relational query. */
const withStatsInputs = {
  targets: { columns: { id: true, value: true, effectiveFrom: true } },
  checkIns: { columns: { date: true, backfilled: true } },
  skips: { columns: { periodStart: true, reason: true } },
} as const;

type HabitWithInputs = NonNullable<
  Awaited<ReturnType<typeof findHabitWithInputs>>
>;

function findHabitWithInputs(db: Database, id: number) {
  return db.query.habits.findFirst({
    where: eq(habits.id, id),
    with: withStatsInputs,
  });
}

function toHabitView(habit: HabitWithInputs, today: ISODate) {
  return {
    id: habit.id,
    name: habit.name,
    startDate: habit.startDate,
    targets: [...habit.targets].sort((a, b) =>
      b.effectiveFrom.localeCompare(a.effectiveFrom),
    ),
    stats: computeHabitStats({
      startDate: habit.startDate,
      today,
      targets: habit.targets,
      checkIns: habit.checkIns,
      skips: habit.skips,
    }),
  };
}

export async function listHabitViews(db: Database) {
  const today = todayInAppZone();
  const rows = await db.query.habits.findMany({
    orderBy: [asc(habits.createdAt), asc(habits.id)],
    with: withStatsInputs,
  });
  return rows.map((h) => toHabitView(h, today));
}

export async function getHabitView(db: Database, id: number) {
  const habit = await findHabitWithInputs(db, id);
  return habit ? toHabitView(habit, todayInAppZone()) : null;
}

export async function requireHabit(db: Database, id: number) {
  const habit = await db.query.habits.findFirst({
    where: eq(habits.id, id),
    columns: { id: true, startDate: true },
  });
  if (!habit) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
  }
  return habit;
}

/** Past and today are fine; the future is not. */
export function assertDateAllowed(date: ISODate, today: ISODate) {
  if (date > today) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That date is in the future",
    });
  }
}

/** Postgres unique_violation, whether or not the driver error is wrapped. */
export function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
  const cause =
    typeof error === "object" && error !== null && "cause" in error
      ? error.cause
      : undefined;
  return code(error) === "23505" || code(cause) === "23505";
}
