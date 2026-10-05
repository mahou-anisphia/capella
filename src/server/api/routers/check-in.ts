import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { formatLong, todayInAppZone } from "~/lib/dates";
import {
  checkInSyncSchema,
  checkInUpdateSchema,
  habitIdSchema,
} from "~/lib/validators";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { checkIns, habits } from "~/server/db/schema";
import {
  assertDateAllowed,
  isUniqueViolation,
  requireHabit,
} from "~/server/habits";

export const checkInRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ habitId: habitIdSchema }))
    .query(({ ctx, input }) =>
      ctx.db.query.checkIns.findMany({
        where: eq(checkIns.habitId, input.habitId),
        columns: { id: true, date: true, note: true, backfilled: true },
        orderBy: [desc(checkIns.date)],
      }),
    ),

  /** The one-tap button. Doing it twice in a day is a no-op. */
  today: publicProcedure
    .input(z.object({ habitId: habitIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const habit = await requireHabit(ctx.db, input.habitId);
      await ctx.db
        .insert(checkIns)
        .values({
          habitId: habit.id,
          date: todayInAppZone(),
          backfilled: false,
        })
        .onConflictDoNothing();
    }),

  undoToday: publicProcedure
    .input(z.object({ habitId: habitIdSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(checkIns)
        .where(
          and(
            eq(checkIns.habitId, input.habitId),
            eq(checkIns.date, todayInAppZone()),
          ),
        );
    }),

  /**
   * Bulk calendar entry: add and remove several days at once. Logging a day before tracking
   * started moves the start date back to it, so backfilling never needs a trip to settings.
   */
  sync: publicProcedure
    .input(checkInSyncSchema)
    .mutation(async ({ ctx, input }) => {
      const habit = await requireHabit(ctx.db, input.habitId);
      const today = todayInAppZone();
      for (const date of input.add) assertDateAllowed(date, today);
      const earliest = [...input.add].sort()[0];

      await ctx.db.transaction(async (tx) => {
        if (earliest && earliest < habit.startDate) {
          await tx
            .update(habits)
            .set({ startDate: earliest })
            .where(eq(habits.id, habit.id));
        }
        if (input.add.length > 0) {
          await tx
            .insert(checkIns)
            .values(
              input.add.map((date) => ({
                habitId: habit.id,
                date,
                backfilled: date < today,
              })),
            )
            .onConflictDoNothing();
        }
        if (input.remove.length > 0) {
          await tx
            .delete(checkIns)
            .where(
              and(
                eq(checkIns.habitId, habit.id),
                inArray(checkIns.date, input.remove),
              ),
            );
        }
      });
    }),

  update: publicProcedure
    .input(checkInUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.checkIns.findFirst({
        where: eq(checkIns.id, input.id),
        columns: { habitId: true, date: true },
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Check-in not found",
        });
      }
      const habit = await requireHabit(ctx.db, existing.habitId);
      const today = todayInAppZone();
      assertDateAllowed(input.date, today);

      try {
        await ctx.db.transaction(async (tx) => {
          if (input.date < habit.startDate) {
            await tx
              .update(habits)
              .set({ startDate: input.date })
              .where(eq(habits.id, habit.id));
          }
          await tx
            .update(checkIns)
            .set({
              date: input.date,
              note: input.note === "" ? null : input.note,
              ...(input.date !== existing.date && {
                backfilled: input.date < today,
              }),
            })
            .where(eq(checkIns.id, input.id));
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `There's already a check-in on ${formatLong(input.date)}.`,
          });
        }
        throw error;
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(checkIns).where(eq(checkIns.id, input.id));
    }),
});
