import { z } from "zod";
import {
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

const requiredNumber = (schema) =>
  z.preprocess(
    (value) =>
      value === null ||
      (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    schema,
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

export const maintenanceCreationSchema = z
  .object({
    title: z.string().trim().min(1),
    serviceDate: serviceDateSchema,
    type: z.enum(MAINTENANCE_TYPES),
    mileageAtService: optionalNumber(z.coerce.number().min(0)),
    totalCost: requiredNumber(z.coerce.number().min(0)),
    description: z.string().trim().optional(),
    parts: z
      .array(z.enum(MAINTENANCE_PARTS))
      .refine(
        (parts) => new Set(parts).size === parts.length,
        "Parts must be unique",
      )
      .optional(),
  })
  .strict();
