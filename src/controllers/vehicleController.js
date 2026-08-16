import {
  createVehicle,
  getVehicleByIdForOwner,
  getVehiclesByOwner,
  updateVehicleForOwner,
} from "../models/vehicleModel.js";

export const addVehicle = async (req, res) => {
  const userId = req.user.id;
  const vehicle = await createVehicle(userId, req.body);

  res.status(201).json({
    success: true,
    data: { vehicle },
  });
};

export const getVehicles = async (req, res) => {
  const userId = req.user.id;
  const vehicles = await getVehiclesByOwner(userId);

  res.status(200).json({
    success: true,
    data: { vehicles },
  });
};

export const getVehicle = async (req, res) => {
  const userId = req.user.id;
  const { vehicleId } = req.params;
  const vehicle = await getVehicleByIdForOwner(vehicleId, userId);

  res.status(200).json({
    success: true,
    data: { vehicle },
  });
};

export const updateVehicle = async (req, res) => {
  const userId = req.user.id;
  const { vehicleId } = req.params;
  const vehicle = await updateVehicleForOwner(vehicleId, userId, req.body);

  res.status(200).json({
    success: true,
    data: { vehicle },
  });
};
