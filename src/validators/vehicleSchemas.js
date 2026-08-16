import { z } from "zod";

const licensePlateSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().min(1));

const requiredNumber = (schema) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmedValue = value.trim();
      return trimmedValue === "" ? value : Number(trimmedValue);
    },
    schema,
  );

const dateSchema = z
  .union([z.date(), z.string().trim().min(1), z.number()])
  .pipe(z.coerce.date());

const optionalDate = dateSchema.optional();

const editableVehicleFields = {
  licensePlate: licensePlateSchema,
  manufacturer: z.string().trim().min(1),
  model: z.string().trim().min(1),
  year: requiredNumber(z.number().int()),
  fuelType: z.string().trim().min(1),
  currentMileage: requiredNumber(z.number().min(0)),
  trimLevel: z.string().trim().optional(),
  color: z.string().trim().optional(),
  vehicleLicenseValidUntil: optionalDate,
};

export const manualVehicleCreationSchema = z
  .object(editableVehicleFields)
  .strict();

export const governmentAssistedVehicleCreationSchema = z.object({
  licensePlate: licensePlateSchema,
  currentMileage: requiredNumber(z.number().min(0)),
});

export const vehicleUpdateSchema = z
  .object({
    ...editableVehicleFields,
    vehicleLicenseValidUntil: optionalDate.nullable(),
  })
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

export const governmentVehicleLookupParamsSchema = z
  .object({
    licensePlate: licensePlateSchema,
  })
  .strict();
