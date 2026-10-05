"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";

import { DatePicker } from "~/components/date/date-picker";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { formatLong } from "~/lib/dates";
import { targetSetSchema } from "~/lib/validators";
import { api } from "~/trpc/react";

type Values = z.infer<typeof targetSetSchema>;

/**
 * Each entry applies from its date onward. A fortnight is judged by the latest entry in effect by
 * its last day, so old fortnights keep the target they had.
 */
export function TargetHistory({ id }: { id: number }) {
  const [habit] = api.habit.get.useSuspenseQuery({ id });
  const utils = api.useUtils();
  const onError = (error: { message: string }) => toast(error.message);

  const form = useForm<Values>({
    resolver: zodResolver(targetSetSchema),
    defaultValues: {
      habitId: id,
      value: habit?.stats.currentTarget ?? 8,
      effectiveFrom: habit?.stats.today ?? "",
    },
  });
  const { errors } = form.formState;

  const setTarget = api.habit.setTarget.useMutation({
    onError,
    onSuccess: () => toast("Target saved."),
    onSettled: () => utils.invalidate(),
  });
  const deleteTarget = api.habit.deleteTarget.useMutation({
    onError,
    onSettled: () => utils.invalidate(),
  });

  if (!habit) return null;

  return (
    <section className="bg-card ring-border shadow-surface flex flex-col gap-3 rounded-xl p-4 ring-1">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">Target per fortnight</h2>
        <p className="text-muted-foreground text-xs">
          Each change applies from its date on. Older fortnights keep the target
          they had, so backfilled days are judged fairly.
        </p>
      </div>

      <ul className="divide-border divide-y">
        {habit.targets.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2">
            <span className="text-sm">
              <span className="font-semibold tabular-nums">{t.value}</span>
              <span className="text-muted-foreground">
                {" "}
                from {formatLong(t.effectiveFrom)}
              </span>
            </span>
            {habit.targets.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label={`Remove target from ${formatLong(t.effectiveFrom)}`}
                disabled={deleteTarget.isPending}
                onClick={() => deleteTarget.mutate({ id: t.id })}
              >
                <Trash2Icon />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <form
        onSubmit={form.handleSubmit((values) => setTarget.mutate(values))}
        className="flex flex-wrap items-end gap-3"
      >
        <Field data-invalid={!!errors.value} className="w-24">
          <FieldLabel htmlFor="target-value">Target</FieldLabel>
          <Input
            id="target-value"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            {...form.register("value", { valueAsNumber: true })}
          />
        </Field>
        <Field data-invalid={!!errors.effectiveFrom} className="w-44">
          <FieldLabel htmlFor="target-from">From</FieldLabel>
          <Controller
            control={form.control}
            name="effectiveFrom"
            render={({ field, fieldState }) => (
              <DatePicker
                id="target-from"
                value={field.value}
                onChange={field.onChange}
                today={habit.stats.today}
                invalid={fieldState.invalid}
              />
            )}
          />
        </Field>
        <Button
          type="submit"
          className="rounded-full px-4"
          disabled={setTarget.isPending}
        >
          Set target
        </Button>
        <FieldError
          className="w-full"
          errors={[errors.value, errors.effectiveFrom]}
        />
      </form>
    </section>
  );
}
