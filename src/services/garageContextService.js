import { getGarageVehiclesByOwner } from "../models/vehicleModel.js";

const toId = (value) => {
  const id = value?._id ?? value;
  return id ? String(id) : null;
};

const toGarageVehicle = (vehicle) => ({
  id: toId(vehicle),
  manufacturer: vehicle.manufacturer,
  model: vehicle.model,
  year: vehicle.year,
  currentMileage: vehicle.currentMileage,
});

export const loadGarageContext = async ({ userId, focusedVehicleId }) => {
  const vehicles = (await getGarageVehiclesByOwner(userId)).map(
    toGarageVehicle,
  );
  const requestedFocusId = toId(focusedVehicleId);
  const hasRequestedFocus = vehicles.some(
    ({ id }) => id === requestedFocusId,
  );

  return {
    focusedVehicleId: hasRequestedFocus ? requestedFocusId : null,
    vehicles,
  };
};
