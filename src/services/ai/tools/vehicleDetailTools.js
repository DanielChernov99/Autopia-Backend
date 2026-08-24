import { z } from "zod";
import {
  getVehicleByIdForOwner,
  getVehiclesByOwner,
} from "../../../models/vehicleModel.js";
import { toAIVehicleDetails } from "../vehicleMappers.js";

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

export const createVehicleDetailTools = ({
  defineTool,
  findOwnedVehicle = getVehicleByIdForOwner,
  listOwnedVehicles = getVehiclesByOwner,
} = {}) => {
  if (typeof defineTool !== "function") {
    throw new TypeError("defineTool is required");
  }

  const getVehicleDetails = defineTool({
    name: "get_vehicle_details",
    description:
      "Retrieves detailed persisted vehicle information for one vehicle owned by the authenticated user, including specifications, validity dates, tire sizes, registration date, and last test date. Maintenance history and reminders are retrieved by their dedicated tools.",
    argsSchema: z.object({
      vehicleId: z.string().regex(objectIdPattern),
    }),
    execute: async ({ args, userId }) => {
      const vehicle = await findOwnedVehicle(args.vehicleId, userId);

      return { vehicle: toAIVehicleDetails(vehicle) };
    },
  });

  const getMyVehicleDetails = defineTool({
    name: "get_my_vehicle_details",
    description:
      "Retrieves the same detailed persisted vehicle information for all vehicles owned by the authenticated user. Use for detailed cross-vehicle questions or comparisons. Maintenance history and reminders remain in their dedicated tools.",
    argsSchema: z.object({}),
    execute: async ({ userId }) => {
      const vehicles = await listOwnedVehicles(userId);

      return { vehicles: vehicles.map(toAIVehicleDetails) };
    },
  });

  return [getVehicleDetails, getMyVehicleDetails];
};
