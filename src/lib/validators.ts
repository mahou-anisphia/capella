import { z } from "zod";

import { FORTNIGHT_DAYS, isValidISODate } from "~/lib/dates";
import { SKIP_REASONS } from "~/lib/habit-stats";

/**
 * Zod schemas shared by tRPC inputs and client forms. Rules that need "today" (no future dates)
 * are enforced on the server against the app timezone; forms mirror them with `max` attributes.
 */

export const isoDateSchema = z
  .string()
  .refine(isValidISODate, { message: "Pick a valid date" });

export const habitIdSchema = z.number().int().positive();

export const habitNameSchema = z
  .string()
  .trim()
  .min(1, "Give it a name")
  .max(100, "Keep it under 100 characters");

/** At most one check-in a day, so a fortnight can't need more than 14. */
export const targetValueSchema = z
  .number({ invalid_type_error: "Enter a number" })
  .int("Whole numbers only")
  .min(1, "At least 1")
  .max(FORTNIGHT_DAYS, `At most ${FORTNIGHT_DAYS} — one per day`);

export const habitCreateSchema = z.object({
  name: habitNameSchema,
  target: targetValueSchema,
  startDate: isoDateSchema,
});

export const habitUpdateSchema = z.object({
  id: habitIdSchema,
  name: habitNameSchema,
  startDate: isoDateSchema,
});

export const targetSetSchema = z.object({
  habitId: habitIdSchema,
  value: targetValueSchema,
  effectiveFrom: isoDateSchema,
});

export const checkInNoteSchema = z
  .string()
  .trim()
  .max(500, "Keep notes under 500 characters");

export const checkInUpdateSchema = z.object({
  id: z.number().int().positive(),
  date: isoDateSchema,
  note: checkInNoteSchema,
});

export const checkInSyncSchema = z.object({
  habitId: habitIdSchema,
  add: z.array(isoDateSchema).max(366),
  remove: z.array(isoDateSchema).max(366),
});

export const skipReasonSchema = z.enum(SKIP_REASONS);

export const periodSkipSchema = z.object({
  habitId: habitIdSchema,
  periodStart: isoDateSchema,
  reason: skipReasonSchema.nullable(),
});
