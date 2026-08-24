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

export const chatMessageSchema = z
  .object({
    message: z.string().trim().min(1),
    conversationId: objectIdSchema("Invalid conversation ID").optional(),
    title: z.string().trim().min(1).optional(),
    primaryVehicleId: objectIdSchema("Invalid vehicle ID")
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (!data.conversationId && !data.title) {
      context.addIssue({
        code: "custom",
        message: "Title is required for a new conversation",
        path: ["title"],
      });
    }

    if (data.conversationId && data.title !== undefined) {
      context.addIssue({
        code: "custom",
        message: "Title is only allowed for a new conversation",
        path: ["title"],
      });
    }

    if (data.conversationId && data.primaryVehicleId !== undefined) {
      context.addIssue({
        code: "custom",
        message: "Primary vehicle is only allowed for a new conversation",
        path: ["primaryVehicleId"],
      });
    }
  });
