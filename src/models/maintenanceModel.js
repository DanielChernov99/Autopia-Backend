import mongoose from "mongoose";
import Maintenance from "../db/models/Maintenance.js";
import Vehicle from "../db/models/Vehicle.js";
import AppError from "../utils/AppError.js";

const maintenanceNotFound = () => new AppError("Maintenance not found", 404);
const vehicleNotFound = () => new AppError("Vehicle not found", 404);

const syncVehicleMetricsOnMaintenance = async (
  vehicleId,
  maintenanceData,
  session,
) => {
  const maximums = {};

  if (
    maintenanceData.mileageAtMaintenance !== undefined &&
    maintenanceData.mileageAtMaintenance !== null
  ) {
    maximums.currentMileage = maintenanceData.mileageAtMaintenance;
  }

  if (maintenanceData.maintenanceDate) {
    maximums.lastMaintenanceDate = new Date(maintenanceData.maintenanceDate);
  }

  let vehicle;

  if (Object.keys(maximums).length > 0) {
    vehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $max: maximums },
      { new: true, runValidators: true, session },
    );
  } else {
    vehicle = await Vehicle.findById(vehicleId).session(session);
  }

  if (!vehicle) {
    throw vehicleNotFound();
  }

  return vehicle;
};

export const createMaintenance = async (vehicleId, maintenanceData) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const [maintenance] = await Maintenance.create(
        [{ ...maintenanceData, vehicleId }],
        { session },
      );
      const vehicle = await syncVehicleMetricsOnMaintenance(
        vehicleId,
        maintenanceData,
        session,
      );

      result = { maintenance, vehicle };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const getMaintenancesByVehicle = (vehicleId) =>
  Maintenance.find({ vehicleId }).sort({ maintenanceDate: -1, createdAt: -1 });

export const getRecentMaintenancesByVehicle = (vehicleId, limit) =>
  Maintenance.find({ vehicleId })
    .select({
      _id: 1,
      title: 1,
      maintenanceDate: 1,
      type: 1,
      mileageAtMaintenance: 1,
      totalCost: 1,
      description: 1,
      parts: 1,
    })
    .sort({ maintenanceDate: -1, createdAt: -1 })
    .limit(limit)
    .lean();

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
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const existingMaintenance = await Maintenance.findOne({
        _id: maintenanceId,
        vehicleId,
      }).session(session);

      if (!existingMaintenance) {
        throw maintenanceNotFound();
      }

      const hasMileageUpdate = Object.hasOwn(
        updateData,
        "mileageAtMaintenance",
      );
      const previousMileage = existingMaintenance.mileageAtMaintenance ?? null;
      const nextMileage = updateData.mileageAtMaintenance ?? null;
      const mileageChanged =
        hasMileageUpdate && previousMileage !== nextMileage;
      const fieldsToSet = { ...updateData };
      const update = {};

      if (hasMileageUpdate && nextMileage === null) {
        delete fieldsToSet.mileageAtMaintenance;
        update.$unset = { mileageAtMaintenance: 1 };
      }

      if (Object.keys(fieldsToSet).length > 0) {
        update.$set = fieldsToSet;
      }

      const maintenance = await Maintenance.findOneAndUpdate(
        { _id: maintenanceId, vehicleId },
        update,
        { new: true, runValidators: true, session },
      );

      if (!maintenance) {
        throw maintenanceNotFound();
      }

      const vehicle = await syncVehicleMetricsOnMaintenance(
        vehicleId,
        {
          maintenanceDate: updateData.maintenanceDate,
          mileageAtMaintenance:
            mileageChanged && nextMileage !== null ? nextMileage : undefined,
        },
        session,
      );

      result = { maintenance, vehicle };
    });

    return result;
  } finally {
    await session.endSession();
  }
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
