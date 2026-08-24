import { z } from "zod";
import { getRecentMaintenancesByVehicle } from "../../../models/maintenanceModel.js";
import {
  getGarageVehiclesByOwner,
  getVehicleByIdForOwner,
} from "../../../models/vehicleModel.js";

export const DEFAULT_MAINTENANCE_LIMIT = 10;
export const MAX_MAINTENANCE_LIMIT = 20;

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const compactVehicle = (vehicle) => ({
  id: vehicle._id.toString(),
  manufacturer: vehicle.manufacturer,
  model: vehicle.model,
  year: vehicle.year,
  currentMileage: vehicle.currentMileage,
});

const compactMaintenance = (maintenance) => ({
  id: maintenance._id.toString(),
  title: maintenance.title,
  date: maintenance.maintenanceDate.toISOString(),
  type: maintenance.type,
  mileage: maintenance.mileageAtMaintenance ?? null,
  cost: maintenance.totalCost,
  description: maintenance.description ?? null,
  parts: maintenance.parts ?? [],
});

export const createVehicleMaintenanceTools = ({
  defineTool,
  listVehicles = getGarageVehiclesByOwner,
  findOwnedVehicle = getVehicleByIdForOwner,
  listMaintenance = getRecentMaintenancesByVehicle,
} = {}) => {
  if (typeof defineTool !== "function") {
    throw new TypeError("defineTool is required");
  }

  const getMyVehicles = defineTool({
    name: "get_my_vehicles",
    description:
      "Lists the authenticated user's current vehicles using compact identifying details.",
    argsSchema: z.object({}),
    execute: async ({ userId }) => {
      const vehicles = await listVehicles(userId);

      return { vehicles: vehicles.map(compactVehicle) };
    },
  });

  const getVehicleMaintenance = defineTool({
    name: "get_vehicle_maintenance",
    description:
      "Retrieves authoritative persisted maintenance history for a specific vehicle owned by the authenticated user. Base Garage Context does not include maintenance details.",
    argsSchema: z.object({
      vehicleId: z.string().regex(objectIdPattern),
      limit: z
        .number()
        .int()
        .min(1)
        .max(MAX_MAINTENANCE_LIMIT)
        .optional()
        .meta({
          default: DEFAULT_MAINTENANCE_LIMIT,
          description: "Maximum records to return; defaults to 10.",
        }),
    }),
    execute: async ({ args, userId }) => {
      await findOwnedVehicle(args.vehicleId, userId);
      const limit = args.limit ?? DEFAULT_MAINTENANCE_LIMIT;
      const maintenance = await listMaintenance(args.vehicleId, limit);

      return {
        vehicleId: args.vehicleId,
        maintenance: maintenance.map(compactMaintenance),
      };
    },
  });

  return [getMyVehicles, getVehicleMaintenance];
};
