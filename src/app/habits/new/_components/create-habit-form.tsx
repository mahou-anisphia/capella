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
import { type ISODate } from "~/lib/dates";
import { habitCreateSchema } from "~/lib/validators";
import { api } from "~/trpc/react";

type Values = z.infer<typeof habitCreateSchema>;

export function CreateHabitForm({ today }: { today: ISODate }) {
  const router = useRouter();
  const utils = api.useUtils();
  const form = useForm<Values>({
    resolver: zodResolver(habitCreateSchema),
    defaultValues: { name: "", target: 8, startDate: today },
  });
  const { errors } = form.formState;

  const create = api.habit.create.useMutation({
    onSuccess: async () => {
      await utils.habit.list.invalidate();
      router.push("/");
    },
    onError: (error) => toast(error.message),
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => create.mutate(values))}
      className="bg-card ring-border shadow-surface rounded-xl p-5 ring-1"
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            placeholder="Workout"
            autoFocus
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.target}>
          <FieldLabel htmlFor="target">Check-ins per fortnight</FieldLabel>
          <Input
            id="target"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            className="w-24"
            aria-invalid={!!errors.target}
            {...form.register("target", { valueAsNumber: true })}
          />
          <FieldDescription>
            At least this many days in each two-week period.
          </FieldDescription>
          <FieldError errors={[errors.target]} />
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
                today={today}
                invalid={fieldState.invalid}
              />
            )}
          />
          <FieldDescription>
            You can log earlier days any time; the start moves back to match.
          </FieldDescription>
          <FieldError errors={[errors.startDate]} />
        </Field>
        <Button
          type="submit"
          disabled={create.isPending}
          className="h-10 self-start rounded-full px-5"
        >
          {create.isPending ? "Creating…" : "Create habit"}
        </Button>
      </FieldGroup>
    </form>
  );
}
