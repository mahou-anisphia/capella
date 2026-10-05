// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import { check, pgTableCreator, unique } from "drizzle-orm/pg-core";

import { SKIP_REASONS } from "~/lib/habit-stats";

/**
 * Every table must be declared through `createTable` so it gets the `capella_` prefix.
 * drizzle-kit only manages tables matching `tablesFilter: ["capella_*"]` in drizzle.config.ts.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `capella_${name}`);

/** Calendar dates are stored as `date` (no time, no zone) and handled as `YYYY-MM-DD` strings. */

export const habits = createTable("habit", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 100 }).notNull(),
  startDate: d.date({ mode: "string" }).notNull(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

/** Target history: a period is judged by the latest entry effective by its last day. */
export const habitTargets = createTable(
  "habit_target",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    habitId: d
      .integer()
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    value: d.integer().notNull(),
    effectiveFrom: d.date({ mode: "string" }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    // Also serves as the habitId index (leading column).
    unique("capella_habit_target_habit_effective_from_unique").on(
      t.habitId,
      t.effectiveFrom,
    ),
    check("capella_habit_target_value_check", sql`${t.value} >= 1`),
  ],
);

/** One row per habit per calendar day; the unique constraint is the "one check-in a day" rule. */
export const checkIns = createTable(
  "check_in",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    habitId: d
      .integer()
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: d.date({ mode: "string" }).notNull(),
    note: d.text(),
    /** Logged after the day it refers to. */
    backfilled: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    // Also serves as the habitId index (leading column).
    unique("capella_check_in_habit_date_unique").on(t.habitId, t.date),
  ],
);

/** A fortnight marked as rest (sick, travel…): excluded from streaks instead of counted as a miss. */
export const periodSkips = createTable(
  "period_skip",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    habitId: d
      .integer()
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    /** Monday the fortnight starts on. */
    periodStart: d.date({ mode: "string" }).notNull(),
    reason: d.text({ enum: SKIP_REASONS }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    // Also serves as the habitId index (leading column).
    unique("capella_period_skip_habit_period_unique").on(
      t.habitId,
      t.periodStart,
    ),
    check(
      "capella_period_skip_reason_check",
      sql`${t.reason} in (${sql.raw(SKIP_REASONS.map((r) => `'${r}'`).join(", "))})`,
    ),
  ],
);

export const habitsRelations = relations(habits, ({ many }) => ({
  targets: many(habitTargets),
  checkIns: many(checkIns),
  skips: many(periodSkips),
}));

export const habitTargetsRelations = relations(habitTargets, ({ one }) => ({
  habit: one(habits, {
    fields: [habitTargets.habitId],
    references: [habits.id],
  }),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  habit: one(habits, { fields: [checkIns.habitId], references: [habits.id] }),
}));

export const periodSkipsRelations = relations(periodSkips, ({ one }) => ({
  habit: one(habits, {
    fields: [periodSkips.habitId],
    references: [habits.id],
  }),
}));
