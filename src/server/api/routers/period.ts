import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { fortnightOf, todayInAppZone } from "~/lib/dates";
import {
  habitIdSchema,
  isoDateSchema,
  periodSkipSchema,
} from "~/lib/validators";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { periodSkips } from "~/server/db/schema";
import { requireHabit } from "~/server/habits";

export const periodRouter = createTRPCRouter({
  /** Marks a fortnight as rest, or changes the reason on one already resting. */
  skip: publicProcedure
    .input(periodSkipSchema)
    .mutation(async ({ ctx, input }) => {
      const habit = await requireHabit(ctx.db, input.habitId);
      const { start } = fortnightOf(input.periodStart);
      if (start !== input.periodStart) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not the start of a fortnight",
        });
      }
      if (
        start > todayInAppZone() ||
        fortnightOf(habit.startDate).start > start
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That fortnight isn't being tracked",
        });
      }
      await ctx.db
        .insert(periodSkips)
        .values(input)
        .onConflictDoUpdate({
          target: [periodSkips.habitId, periodSkips.periodStart],
          set: { reason: input.reason },
        });
    }),

  unskip: publicProcedure
    .input(z.object({ habitId: habitIdSchema, periodStart: isoDateSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(periodSkips)
        .where(
          and(
            eq(periodSkips.habitId, input.habitId),
            eq(periodSkips.periodStart, input.periodStart),
          ),
        );
    }),
});
