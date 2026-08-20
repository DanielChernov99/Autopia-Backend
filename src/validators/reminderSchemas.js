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

export const reminderCreationSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    type: z.enum(REMINDER_TYPES),
    dueDate: reminderDueDateSchema,
    frequency: z.enum(REMINDER_FREQUENCIES),
  })
  .strict();
