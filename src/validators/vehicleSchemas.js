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

export const manualVehicleCreationSchema = z.object({
  licensePlate: licensePlateSchema,
  manufacturer: z.string().trim().min(1),
  model: z.string().trim().min(1),
  year: requiredNumber(z.coerce.number().int()),
  fuelType: z.string().trim().min(1),
  currentMileage: requiredNumber(z.coerce.number().min(0)),
  trimLevel: z.string().trim().optional(),
  color: z.string().trim().optional(),
  vehicleLicenseValidUntil: optionalDate,
});

export const governmentAssistedVehicleCreationSchema = z.object({
  licensePlate: licensePlateSchema,
  currentMileage: requiredNumber(z.coerce.number().min(0)),
});
