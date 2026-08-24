import {
  PROVIDER_ERROR_CODES,
  ProviderError,
} from "../services/ai/providerError.js";

export const DEFAULT_GEMINI_TIMEOUT_MS = 30000;

const configurationError = (reason) =>
  new ProviderError(PROVIDER_ERROR_CODES.CONFIGURATION, {
    cause: new Error(reason),
  });

const getRequiredValue = (environment, name) => {
  const value = environment[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw configurationError(`${name} is required`);
  }

  return value.trim();
};

const getTimeoutMs = (environment) => {
  const value = environment.GEMINI_TIMEOUT_MS;

  if (value === undefined) {
    return DEFAULT_GEMINI_TIMEOUT_MS;
  }

  const normalizedValue =
    typeof value === "string" ? value.trim() : String(value);

  if (!/^\d+$/.test(normalizedValue)) {
    throw configurationError(
      "GEMINI_TIMEOUT_MS must be a positive integer",
    );
  }

  const timeoutMs = Number(normalizedValue);

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw configurationError(
      "GEMINI_TIMEOUT_MS must be a positive integer",
    );
  }

  return timeoutMs;
};

export const getGeminiConfig = (environment = process.env) => ({
  apiKey: getRequiredValue(environment, "GEMINI_API_KEY"),
  model: getRequiredValue(environment, "GEMINI_MODEL"),
  timeoutMs: getTimeoutMs(environment),
});
