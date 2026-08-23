import { z } from "zod";
import { MESSAGE_ROLES } from "../constants/conversation.js";

const objectIdSchema = (message) =>
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, message);

export const conversationCreationSchema = z
  .object({
    title: z.string().trim().min(1),
    primaryVehicleId: objectIdSchema("Invalid vehicle ID").nullable().optional(),
  })
  .strict();

export const conversationParamsSchema = z
  .object({
    conversationId: objectIdSchema("Invalid conversation ID"),
  })
  .strict();

export const messageCreationSchema = z
  .object({
    role: z.enum(MESSAGE_ROLES),
    content: z.string().trim().min(1),
  })
  .strict();
