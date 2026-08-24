import { registeredTools, toProviderToolDefinitions } from "./toolRegistry.js";
import { TOOL_ERROR_CODES, ToolError } from "./toolError.js";

const reservedIdentityFields = new Set(["userId", "owner", "ownerId"]);

const containsReservedIdentity = (value) => {
  if (Array.isArray(value)) {
    return value.some(containsReservedIdentity);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      reservedIdentityFields.has(key) || containsReservedIdentity(nestedValue),
  );
};

const normalizeResult = (result) => {
  const normalizedValue = result === undefined ? null : result;

  try {
    return JSON.parse(JSON.stringify(normalizedValue));
  } catch (error) {
    throw new ToolError(TOOL_ERROR_CODES.EXECUTION_FAILED, { cause: error });
  }
};

export const createToolExecutor = ({ tools = registeredTools } = {}) => {
  const toolByName = new Map();

  for (const tool of tools) {
    if (toolByName.has(tool.name)) {
      throw new TypeError(`Duplicate tool name: ${tool.name}`);
    }

    toolByName.set(tool.name, tool);
  }

  const providerToolDefinitions = Object.freeze(
    toProviderToolDefinitions(tools),
  );

  return Object.freeze({
    getToolDefinitions: () => providerToolDefinitions,

    async executeTool({ name, args, userId }) {
      const tool = toolByName.get(name);

      if (!tool) {
        throw new ToolError(TOOL_ERROR_CODES.UNKNOWN_TOOL);
      }

      if (userId === undefined || userId === null) {
        throw new ToolError(TOOL_ERROR_CODES.EXECUTION_FAILED);
      }

      const untrustedArgs = args ?? {};

      if (containsReservedIdentity(untrustedArgs)) {
        throw new ToolError(TOOL_ERROR_CODES.INVALID_ARGUMENTS);
      }

      const validation = tool.validateArgs(untrustedArgs);

      if (!validation.success) {
        throw new ToolError(TOOL_ERROR_CODES.INVALID_ARGUMENTS, {
          cause: validation.error,
        });
      }

      try {
        const result = await tool.execute({
          args: validation.data,
          userId,
        });

        return {
          name: tool.name,
          result: normalizeResult(result),
        };
      } catch (error) {
        if (error instanceof ToolError) {
          throw error;
        }

        throw new ToolError(TOOL_ERROR_CODES.EXECUTION_FAILED, {
          cause: error,
        });
      }
    },
  });
};

export const toolExecutor = createToolExecutor();
