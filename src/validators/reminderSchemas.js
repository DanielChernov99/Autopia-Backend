import { z } from "zod";
import {
  REMINDER_FREQUENCIES,
  REMINDER_TYPES,
} from "../constants/reminder.js";

const reminderDueDateSchema = z.preprocess(
  (value) =>
    value === null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.coerce.date(),
);

const objectIdSchema = (message) =>
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, message);

const editableReminderFields = {
  title: z.string().trim().min(1).optional(),
  type: z.enum(REMINDER_TYPES),
  dueDate: reminderDueDateSchema,
  frequency: z.enum(REMINDER_FREQUENCIES),
};

export const reminderCreationSchema = z
  .object(editableReminderFields)
  .strict();

export const reminderUpdateSchema = z
  .object(editableReminderFields)
  .partial()
  .strict()
  .refine((update) => Object.keys(update).length > 0, {
    message: "At least one reminder field is required",
  });

export const reminderParamsSchema = z
  .object({
    vehicleId: objectIdSchema("Invalid vehicle ID"),
    reminderId: objectIdSchema("Invalid reminder ID"),
  })
  .strict();
