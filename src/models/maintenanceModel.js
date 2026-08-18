import Maintenance from "../db/models/Maintenance.js";
import AppError from "../utils/AppError.js";

const maintenanceNotFound = () => new AppError("Maintenance not found", 404);

export const createMaintenance = (vehicleId, maintenanceData) =>
  Maintenance.create({ ...maintenanceData, vehicleId });

export const getMaintenancesByVehicle = (vehicleId) =>
  Maintenance.find({ vehicleId }).sort({ serviceDate: -1, createdAt: -1 });

export const getMaintenanceByIdForVehicle = async (
  maintenanceId,
  vehicleId,
) => {
  const maintenance = await Maintenance.findOne({
    _id: maintenanceId,
    vehicleId,
  });

  if (!maintenance) {
    throw maintenanceNotFound();
  }

  return maintenance;
};

export const updateMaintenanceForVehicle = async (
  maintenanceId,
  vehicleId,
  updateData,
) => {
  const maintenance = await Maintenance.findOneAndUpdate(
    { _id: maintenanceId, vehicleId },
    updateData,
    { new: true, runValidators: true },
  );

  if (!maintenance) {
    throw maintenanceNotFound();
  }

  return maintenance;
};

export const deleteMaintenanceForVehicle = async (maintenanceId, vehicleId) => {
  const maintenance = await Maintenance.findOneAndDelete({
    _id: maintenanceId,
    vehicleId,
  });

  if (!maintenance) {
    throw maintenanceNotFound();
  }

  return maintenance;
};
