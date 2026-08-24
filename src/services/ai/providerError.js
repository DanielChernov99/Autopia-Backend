import AppError from "../../utils/AppError.js";

export const PROVIDER_ERROR_CODES = Object.freeze({
  CONFIGURATION: "AI_PROVIDER_CONFIGURATION_ERROR",
  TIMEOUT: "AI_PROVIDER_TIMEOUT",
  UNAVAILABLE: "AI_PROVIDER_UNAVAILABLE",
  INVALID_RESPONSE: "AI_PROVIDER_INVALID_RESPONSE",
});

const errorDefinitionByCode = Object.freeze({
  [PROVIDER_ERROR_CODES.CONFIGURATION]: {
    message: "AI provider configuration is invalid",
    statusCode: 500,
  },
  [PROVIDER_ERROR_CODES.TIMEOUT]: {
    message: "AI provider request timed out",
    statusCode: 504,
  },
  [PROVIDER_ERROR_CODES.UNAVAILABLE]: {
    message: "AI provider is currently unavailable",
    statusCode: 502,
  },
  [PROVIDER_ERROR_CODES.INVALID_RESPONSE]: {
    message: "AI provider returned an invalid response",
    statusCode: 502,
  },
});

export class ProviderError extends AppError {
  constructor(code, { cause, upstreamStatus } = {}) {
    const definition = errorDefinitionByCode[code];

    if (!definition) {
      throw new TypeError(`Unsupported provider error code: ${code}`);
    }

    super(definition.message, definition.statusCode);
    this.name = "ProviderError";
    this.code = code;

    if (cause !== undefined) {
      this.cause = cause;
    }

    if (upstreamStatus !== undefined) {
      this.upstreamStatus = upstreamStatus;
    }
  }
}
