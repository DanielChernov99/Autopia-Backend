import AppError from "../../utils/AppError.js";

export const TOOL_ERROR_CODES = Object.freeze({
  UNKNOWN_TOOL: "AI_TOOL_UNKNOWN",
  INVALID_ARGUMENTS: "AI_TOOL_INVALID_ARGUMENTS",
  EXECUTION_FAILED: "AI_TOOL_EXECUTION_FAILED",
  ITERATION_LIMIT: "AI_TOOL_ITERATION_LIMIT",
});

const errorDefinitionByCode = Object.freeze({
  [TOOL_ERROR_CODES.UNKNOWN_TOOL]: {
    message: "AI tool request could not be completed",
    statusCode: 502,
  },
  [TOOL_ERROR_CODES.INVALID_ARGUMENTS]: {
    message: "AI tool request could not be completed",
    statusCode: 502,
  },
  [TOOL_ERROR_CODES.EXECUTION_FAILED]: {
    message: "AI tool request could not be completed",
    statusCode: 502,
  },
  [TOOL_ERROR_CODES.ITERATION_LIMIT]: {
    message: "AI tool iteration limit exceeded",
    statusCode: 502,
  },
});

export class ToolError extends AppError {
  constructor(code, { cause } = {}) {
    const definition = errorDefinitionByCode[code];

    if (!definition) {
      throw new TypeError(`Unsupported tool error code: ${code}`);
    }

    super(definition.message, definition.statusCode);
    this.name = "ToolError";
    this.code = code;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
