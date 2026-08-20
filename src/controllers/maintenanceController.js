import {
  createMaintenance,
  deleteMaintenanceForVehicle,
  getMaintenanceByIdForVehicle,
  getMaintenancesByVehicle,
  updateMaintenanceForVehicle,
} from "../models/maintenanceModel.js";

export const addMaintenance = async (req, res) => {
  const { vehicleId } = req.params;
  const { maintenance, vehicle } = await createMaintenance(vehicleId, req.body);

  res.status(201).json({
    success: true,
    data: { maintenance, vehicle },
  });
};

export const getMaintenances = async (req, res) => {
  const { vehicleId } = req.params;
  const maintenances = await getMaintenancesByVehicle(vehicleId);

  res.status(200).json({
    success: true,
    data: { maintenances },
  });
};

export const getMaintenance = async (req, res) => {
  const { vehicleId, maintenanceId } = req.params;
  const maintenance = await getMaintenanceByIdForVehicle(
    maintenanceId,
    vehicleId,
  );

  res.status(200).json({
    success: true,
    data: { maintenance },
  });
};

export const updateMaintenance = async (req, res) => {
  const { vehicleId, maintenanceId } = req.params;
  const { maintenance, vehicle } = await updateMaintenanceForVehicle(
    maintenanceId,
    vehicleId,
    req.body,
  );

  res.status(200).json({
    success: true,
    data: { maintenance, vehicle },
  });
};

export const deleteMaintenance = async (req, res) => {
  const { vehicleId, maintenanceId } = req.params;
  await deleteMaintenanceForVehicle(maintenanceId, vehicleId);

  res.status(200).json({
    success: true,
    message: "Maintenance deleted",
  });
};
