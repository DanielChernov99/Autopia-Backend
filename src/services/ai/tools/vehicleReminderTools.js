import { z } from "zod";
import { getBoundedRemindersByVehicle } from "../../../models/reminderModel.js";
import { getVehicleByIdForOwner } from "../../../models/vehicleModel.js";

const DEFAULT_REMINDER_LIMIT = 10;
const MAX_REMINDER_LIMIT = 20;

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const compactReminder = (reminder) => ({
  id: reminder._id.toString(),
  title: reminder.title ?? null,
  type: reminder.type,
  dueDate: reminder.dueDate.toISOString(),
  frequency: reminder.frequency,
});

export const createVehicleReminderTools = ({
  defineTool,
  findOwnedVehicle = getVehicleByIdForOwner,
  listReminders = getBoundedRemindersByVehicle,
} = {}) => {
  if (typeof defineTool !== "function") {
    throw new TypeError("defineTool is required");
  }

  const getVehicleReminders = defineTool({
    name: "get_vehicle_reminders",
    description:
      "Retrieves authoritative persisted reminder details for a specific vehicle owned by the authenticated user. Base Garage Context does not include reminder details.",
    argsSchema: z.object({
      vehicleId: z.string().regex(objectIdPattern),
      limit: z
        .number()
        .int()
        .min(1)
        .max(MAX_REMINDER_LIMIT)
        .optional()
        .meta({
          default: DEFAULT_REMINDER_LIMIT,
          description: "Maximum records to return; defaults to 10.",
        }),
    }),
    execute: async ({ args, userId }) => {
      await findOwnedVehicle(args.vehicleId, userId);
      const limit = args.limit ?? DEFAULT_REMINDER_LIMIT;
      const reminders = await listReminders(args.vehicleId, limit);

      return {
        vehicleId: args.vehicleId,
        reminders: reminders.map(compactReminder),
      };
    },
  });

  return [getVehicleReminders];
};
