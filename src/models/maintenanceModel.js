import Maintenance from "../db/models/Maintenance.js";
import Vehicle from "../db/models/Vehicle.js";
import AppError from "../utils/AppError.js";

const maintenanceNotFound = () => new AppError("Maintenance not found", 404);

export const syncVehicleMetricsOnMaintenance = async (vehicleId, maintenanceData) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return null;

  let hasUpdates = false;

  if (
    maintenanceData.mileageAtMaintenance !== undefined &&
    maintenanceData.mileageAtMaintenance !== null &&
    Number(maintenanceData.mileageAtMaintenance) > Number(vehicle.currentMileage || 0)
  ) {
    vehicle.currentMileage = Number(maintenanceData.mileageAtMaintenance);
    hasUpdates = true;
  }

  if (maintenanceData.maintenanceDate) {
    const newDate = new Date(maintenanceData.maintenanceDate);
    if (
      !vehicle.lastMaintenanceDate ||
      newDate >= new Date(vehicle.lastMaintenanceDate)
    ) {
      vehicle.lastMaintenanceDate = newDate;
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await vehicle.save();
  }

  return vehicle;
};

export const createMaintenance = async (vehicleId, maintenanceData) => {
  const maintenance = await Maintenance.create({ ...maintenanceData, vehicleId });
  const vehicle = await syncVehicleMetricsOnMaintenance(vehicleId, maintenanceData);
  return { maintenance, vehicle };
};

export const getMaintenancesByVehicle = (vehicleId) =>
  Maintenance.find({ vehicleId }).sort({ maintenanceDate: -1, createdAt: -1 });

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

  const vehicle = await syncVehicleMetricsOnMaintenance(vehicleId, updateData);

  return { maintenance, vehicle };
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
