"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";

import { DatePicker } from "~/components/date/date-picker";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import { checkInUpdateSchema } from "~/lib/validators";
import { api, type RouterOutputs } from "~/trpc/react";

type Values = z.infer<typeof checkInUpdateSchema>;

export function CheckInEditForm({
  checkIn,
  today,
  onDone,
}: {
  checkIn: RouterOutputs["checkIn"]["list"][number];
  today: string;
  onDone: () => void;
}) {
  const utils = api.useUtils();
  const form = useForm<Values>({
    resolver: zodResolver(checkInUpdateSchema),
    defaultValues: {
      id: checkIn.id,
      date: checkIn.date,
      note: checkIn.note ?? "",
    },
  });
  const { errors } = form.formState;

  const update = api.checkIn.update.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      onDone();
    },
    onError: (error) => toast(error.message),
  });

  const dateId = `date-${checkIn.id}`;
  const noteId = `note-${checkIn.id}`;

  return (
    <form onSubmit={form.handleSubmit((values) => update.mutate(values))}>
      <FieldGroup className="gap-3">
        <Field data-invalid={!!errors.date}>
          <FieldLabel htmlFor={dateId}>Date</FieldLabel>
          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <DatePicker
                id={dateId}
                value={field.value}
                onChange={field.onChange}
                today={today}
                invalid={fieldState.invalid}
              />
            )}
          />
          <FieldError errors={[errors.date]} />
        </Field>
        <Field data-invalid={!!errors.note}>
          <FieldLabel htmlFor={noteId}>Note</FieldLabel>
          <Textarea
            id={noteId}
            rows={2}
            placeholder="Optional"
            {...form.register("note")}
          />
          <FieldError errors={[errors.note]} />
        </Field>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="rounded-full px-4"
            disabled={update.isPending}
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={onDone}
          >
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
