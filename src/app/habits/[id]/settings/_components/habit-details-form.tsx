"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";

import { DatePicker } from "~/components/date/date-picker";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { habitUpdateSchema } from "~/lib/validators";
import { api } from "~/trpc/react";

type Values = z.infer<typeof habitUpdateSchema>;

export function HabitDetailsForm({ id }: { id: number }) {
  const [habit] = api.habit.get.useSuspenseQuery({ id });
  const router = useRouter();
  const utils = api.useUtils();
  const form = useForm<Values>({
    resolver: zodResolver(habitUpdateSchema),
    values: habit
      ? { id, name: habit.name, startDate: habit.startDate }
      : undefined,
  });
  const { errors, isDirty } = form.formState;

  const update = api.habit.update.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.refresh(); // the layout shows the name
      toast("Saved.");
    },
    onError: (error) => toast(error.message),
  });

  if (!habit) return null;

  return (
    <form
      onSubmit={form.handleSubmit((values) => update.mutate(values))}
      className="bg-card ring-border shadow-surface rounded-xl p-4 ring-1"
    >
      <FieldGroup className="gap-4">
        <h2 className="text-base font-semibold">Details</h2>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.startDate}>
          <FieldLabel htmlFor="startDate">Tracking starts</FieldLabel>
          <Controller
            control={form.control}
            name="startDate"
            render={({ field, fieldState }) => (
              <DatePicker
                id="startDate"
                value={field.value}
                onChange={field.onChange}
                today={habit.stats.today}
                invalid={fieldState.invalid}
              />
            )}
          />
          <FieldDescription>
            Fortnights before this are &ldquo;before tracking&rdquo;, never
            misses. A first fortnight that starts partway through stays out of
            streaks.
          </FieldDescription>
          <FieldError errors={[errors.startDate]} />
        </Field>
        <Button
          type="submit"
          className="self-start rounded-full px-4"
          disabled={!isDirty || update.isPending}
        >
          {update.isPending ? "Saving…" : "Save"}
        </Button>
      </FieldGroup>
    </form>
  );
}
