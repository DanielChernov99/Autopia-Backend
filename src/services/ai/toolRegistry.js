import { z } from "zod";
import { createVehicleMaintenanceTools } from "./tools/vehicleMaintenanceTools.js";
import { createVehicleReminderTools } from "./tools/vehicleReminderTools.js";

const toolNamePattern = /^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/;
const reservedIdentityFields = new Set(["userId", "owner", "ownerId"]);

export const defineTool = ({ name, description, argsSchema, execute }) => {
  if (typeof name !== "string" || !toolNamePattern.test(name)) {
    throw new TypeError("Tool name is invalid");
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    throw new TypeError("Tool description is required");
  }

  if (!(argsSchema instanceof z.ZodObject)) {
    throw new TypeError("Tool arguments must use a Zod object schema");
  }

  if (typeof execute !== "function") {
    throw new TypeError("Tool execute handler is required");
  }

  const strictArgsSchema = argsSchema.strict();
  const parameters = z.toJSONSchema(strictArgsSchema);
  const parameterNames = Object.keys(parameters.properties ?? {});

  if (parameterNames.some((field) => reservedIdentityFields.has(field))) {
    throw new TypeError("Tool arguments cannot declare ownership identity");
  }

  return Object.freeze({
    name,
    description: description.trim(),
    parameters,
    validateArgs: (args) => strictArgsSchema.safeParse(args),
    execute,
  });
};

export const toProviderToolDefinitions = (tools) =>
  tools.map(({ name, description, parameters }) => ({
    name,
    description,
    parameters,
  }));

export const registeredTools = Object.freeze(
  [
    ...createVehicleMaintenanceTools({ defineTool }),
    ...createVehicleReminderTools({ defineTool }),
  ],
);
