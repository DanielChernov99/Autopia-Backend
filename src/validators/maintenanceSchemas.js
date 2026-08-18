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

const objectIdSchema = (message) =>
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, message);

const editableMaintenanceFields = {
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
};

export const maintenanceCreationSchema = z
  .object(editableMaintenanceFields)
  .strict();

export const maintenanceUpdateSchema = z
  .object(editableMaintenanceFields)
  .partial()
  .strict()
  .refine((update) => Object.keys(update).length > 0, {
    message: "At least one maintenance field is required",
  });

export const maintenanceParamsSchema = z
  .object({
    vehicleId: objectIdSchema("Invalid vehicle ID"),
    maintenanceId: objectIdSchema("Invalid maintenance ID"),
  })
  .strict();
