import { z } from "zod";
import { getVehicleByIdForOwner } from "../models/vehicleModel.js";
import AppError from "../utils/AppError.js";

const vehicleIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i);

export default async function verifyVehicleOwnership(req, res, next) {
  const result = vehicleIdSchema.safeParse(req.params.vehicleId);

  if (!result.success) {
    return next(new AppError("Invalid vehicle ID", 400));
  }

  req.vehicle = await getVehicleByIdForOwner(result.data, req.user.id);
  next();
}
