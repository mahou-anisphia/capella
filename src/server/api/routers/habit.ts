import { TRPCError } from "@trpc/server";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";

import { formatLong, todayInAppZone } from "~/lib/dates";
import {
  habitCreateSchema,
  habitIdSchema,
  habitUpdateSchema,
  targetSetSchema,
} from "~/lib/validators";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { checkIns, habits, habitTargets } from "~/server/db/schema";
import {
  assertDateAllowed,
  getHabitView,
  listHabitViews,
  requireHabit,
} from "~/server/habits";

export const habitRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) => listHabitViews(ctx.db)),

  get: publicProcedure
    .input(z.object({ id: habitIdSchema }))
    .query(({ ctx, input }) => getHabitView(ctx.db, input.id)),

  create: publicProcedure
    .input(habitCreateSchema)
    .mutation(async ({ ctx, input }) => {
      assertDateAllowed(input.startDate, todayInAppZone());
      return ctx.db.transaction(async (tx) => {
        const [habit] = await tx
          .insert(habits)
          .values({ name: input.name, startDate: input.startDate })
          .returning({ id: habits.id });
        await tx.insert(habitTargets).values({
          habitId: habit!.id,
          value: input.target,
          effectiveFrom: input.startDate,
        });
        return habit!;
      });
    }),

  update: publicProcedure
    .input(habitUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await requireHabit(ctx.db, input.id);
      assertDateAllowed(input.startDate, todayInAppZone());

      const [earliest] = await ctx.db
        .select({ date: checkIns.date })
        .from(checkIns)
        .where(eq(checkIns.habitId, input.id))
        .orderBy(asc(checkIns.date))
        .limit(1);
      if (earliest && earliest.date < input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `There's a check-in on ${formatLong(earliest.date)}, so tracking has to start on or before it.`,
        });
      }

      await ctx.db
        .update(habits)
        .set({ name: input.name, startDate: input.startDate })
        .where(eq(habits.id, input.id));
    }),

  delete: publicProcedure
    .input(z.object({ id: habitIdSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(habits).where(eq(habits.id, input.id));
    }),

  /** Adds a target from a date, or changes the one already starting that day. */
  setTarget: publicProcedure
    .input(targetSetSchema)
    .mutation(async ({ ctx, input }) => {
      await requireHabit(ctx.db, input.habitId);
      assertDateAllowed(input.effectiveFrom, todayInAppZone());
      await ctx.db
        .insert(habitTargets)
        .values(input)
        .onConflictDoUpdate({
          target: [habitTargets.habitId, habitTargets.effectiveFrom],
          set: { value: input.value },
        });
    }),

  deleteTarget: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.query.habitTargets.findFirst({
        where: eq(habitTargets.id, input.id),
        columns: { habitId: true },
      });
      if (!target) return;

      const [row] = await ctx.db
        .select({ n: count() })
        .from(habitTargets)
        .where(eq(habitTargets.habitId, target.habitId));
      if ((row?.n ?? 0) <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A habit needs at least one target.",
        });
      }

      await ctx.db
        .delete(habitTargets)
        .where(
          and(
            eq(habitTargets.id, input.id),
            eq(habitTargets.habitId, target.habitId),
          ),
        );
    }),
});
