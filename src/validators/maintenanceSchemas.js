import { z } from "zod";
import {
  MAINTENANCE_ACTIONS,
  MAINTENANCE_PARTS,
  MAINTENANCE_TYPES,
} from "../constants/maintenance.js";

const optionalNumber = (schema) =>
  z.preprocess(
    (value) =>
      value === null ||
      (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    schema.optional(),
  );

const serviceDateSchema = z.preprocess(
  (value) =>
    value === null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.coerce
    .date()
    .refine((date) => date <= new Date(), "Service date cannot be in the future"),
);

const maintenanceItemSchema = z
  .object({
    part: z.enum(MAINTENANCE_PARTS),
    customPart: z.string().trim().optional(),
    action: z.enum(MAINTENANCE_ACTIONS),
    customAction: z.string().trim().optional(),
    cost: optionalNumber(z.coerce.number().min(0)),
    notes: z.string().trim().optional(),
  })
  .superRefine((item, context) => {
    if (item.part === "other" && !item.customPart) {
      context.addIssue({
        code: "custom",
        message: "Custom part is required when part is other",
        path: ["customPart"],
      });
    }

    if (item.action === "other" && !item.customAction) {
      context.addIssue({
        code: "custom",
        message: "Custom action is required when action is other",
        path: ["customAction"],
      });
    }
  });

export const maintenanceCreationSchema = z
  .object({
    serviceDate: serviceDateSchema,
    maintenanceType: z.enum(MAINTENANCE_TYPES),
    mileageAtService: optionalNumber(z.coerce.number().min(0)),
    totalCost: optionalNumber(z.coerce.number().min(0)),
    garageName: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    items: z.array(maintenanceItemSchema).optional(),
  })
  .strict();
