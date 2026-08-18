import { z } from "zod";
import {
  MAINTENANCE_ACTIONS,
  MAINTENANCE_PARTS,
} from "../constants/maintenance.js";
import { REMINDER_TIME_UNITS } from "../constants/reminder.js";

const optionalNumber = (schema) =>
  z.preprocess(
    (value) =>
      value === null ||
      (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    schema.optional(),
  );

const requiredNumber = (schema) =>
  z.preprocess(
    (value) =>
      value === null ||
      (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    schema,
  );

const optionalDate = z.preprocess(
  (value) =>
    value === null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.coerce.date().optional(),
);

const recurrenceSchema = z
  .object({
    time: z
      .object({
        interval: requiredNumber(z.coerce.number().int().positive()),
        unit: z.enum(REMINDER_TIME_UNITS),
      })
      .optional(),
    mileage: z
      .object({
        interval: requiredNumber(z.coerce.number().int().positive()),
      })
      .optional(),
  })
  .refine(
    (recurrence) =>
      recurrence.time !== undefined || recurrence.mileage !== undefined,
    { message: "Recurrence must contain time or mileage" },
  );

export const reminderCreationSchema = z
  .object({
    title: z.string().trim().min(1),
    notes: z.string().trim().optional(),
    part: z.enum(MAINTENANCE_PARTS).optional(),
    action: z.enum(MAINTENANCE_ACTIONS).optional(),
    customPart: z.string().trim().optional(),
    customAction: z.string().trim().optional(),
    dueDate: optionalDate,
    dueMileage: optionalNumber(z.coerce.number().min(0)),
    recurrence: recurrenceSchema.optional(),
  })
  .strict()
  .superRefine((reminder, context) => {
    if ((reminder.part === undefined) !== (reminder.action === undefined)) {
      context.addIssue({
        code: "custom",
        message: "Part and action must be provided together",
        path: reminder.part === undefined ? ["part"] : ["action"],
      });
    }

    if (reminder.part === "other" && !reminder.customPart) {
      context.addIssue({
        code: "custom",
        message: "Custom part is required when part is other",
        path: ["customPart"],
      });
    }

    if (reminder.action === "other" && !reminder.customAction) {
      context.addIssue({
        code: "custom",
        message: "Custom action is required when action is other",
        path: ["customAction"],
      });
    }

    if (
      reminder.dueDate === undefined &&
      reminder.dueMileage === undefined &&
      reminder.recurrence?.time === undefined &&
      reminder.recurrence?.mileage === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "At least one scheduling condition is required",
        path: ["dueDate"],
      });
    }
  });
