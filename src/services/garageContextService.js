import { getGarageVehiclesByOwner } from "../models/vehicleModel.js";
import { toAIVehicleOverview } from "./ai/vehicleMappers.js";

const toId = (value) => {
  const id = value?._id ?? value?.id ?? value;
  return id ? String(id) : null;
};

export const loadGarageContext = async ({ userId, focusedVehicleId }) => {
  const vehicles = (await getGarageVehiclesByOwner(userId)).map(
    toAIVehicleOverview,
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
