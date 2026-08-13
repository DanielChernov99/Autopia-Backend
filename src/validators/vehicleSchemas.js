import { z } from "zod";

const licensePlateSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().min(1));

const requiredNumber = (schema) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema,
  );

const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.date().optional(),
);

const editableVehicleFields = {
  licensePlate: licensePlateSchema,
  manufacturer: z.string().trim().min(1),
  model: z.string().trim().min(1),
  year: requiredNumber(z.coerce.number().int()),
  fuelType: z.string().trim().min(1),
  currentMileage: requiredNumber(z.coerce.number().min(0)),
  trimLevel: z.string().trim().optional(),
  color: z.string().trim().optional(),
  vehicleLicenseValidUntil: optionalDate,
};

export const manualVehicleCreationSchema = z
  .object(editableVehicleFields)
  .strict();

export const governmentAssistedVehicleCreationSchema = z
  .object({
    licensePlate: licensePlateSchema,
    currentMileage: requiredNumber(z.coerce.number().min(0)),
  })
  .strict();

export const vehicleUpdateSchema = z
  .object(editableVehicleFields)
  .partial()
  .strict()
  .refine((update) => Object.keys(update).length > 0, {
    message: "At least one vehicle field is required",
  });

export const vehicleIdParamsSchema = z
  .object({
    vehicleId: z
      .string()
      .trim()
      .regex(/^[a-f\d]{24}$/i, "Invalid vehicle ID"),
  })
  .strict();
