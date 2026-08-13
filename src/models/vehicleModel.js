import Vehicle from "../db/models/Vehicle.js";
import AppError from "../utils/AppError.js";

const vehicleNotFound = () => new AppError("Vehicle not found", 404);

export const createVehicle = async (userId, vehicleData) => {
  try {
    return await Vehicle.create({ ...vehicleData, owner: userId });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(
        "Vehicle with this license plate already exists",
        409,
      );
    }

    throw error;
  }
};

export const getVehiclesByOwner = (userId) => Vehicle.find({ owner: userId });

export const getVehicleByIdForOwner = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });

  if (!vehicle) {
    throw vehicleNotFound();
  }

  return vehicle;
};

export const updateVehicleForOwner = async (
  vehicleId,
  userId,
  updateData,
) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: vehicleId, owner: userId },
    updateData,
    { new: true, runValidators: true },
  );

  if (!vehicle) {
    throw vehicleNotFound();
  }

  return vehicle;
};
