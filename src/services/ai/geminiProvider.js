import { ApiError, GoogleGenAI } from "@google/genai";
import {
  PROVIDER_ERROR_CODES,
  ProviderError,
} from "./providerError.js";

const timeoutStatuses = new Set([408, 504]);
const configurationStatuses = new Set([400, 401, 403, 404]);

const geminiRoleByAutopiaRole = {
  user: "user",
  assistant: "model",
};

const toGeminiContent = ({ role, content }) => {
  const geminiRole = geminiRoleByAutopiaRole[role];

  if (!geminiRole) {
    throw new TypeError(`Unsupported Autopia message role: ${role}`);
  }

  return {
    role: geminiRole,
    parts: [{ text: content }],
  };
};

const getResponseContent = (response) => {
  const content = response?.text;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new ProviderError(PROVIDER_ERROR_CODES.INVALID_RESPONSE);
  }

  return content;
};

const createGarageSystemInstruction = ({
  focusedVehicleId = null,
  vehicles = [],
} = {}) => {
  const garage = {
    focusedVehicleId,
    vehicles: vehicles.map(
      ({ id, manufacturer, model, year, currentMileage }) => ({
        id,
        manufacturer,
        model,
        year,
        currentMileage,
      }),
    ),
  };

  return [
    "You are Autopia's vehicle assistant.",
    "The JSON below is current Garage Context loaded by the backend for the authenticated user.",
    "focusedVehicleId is the default vehicle, but any listed vehicle may be discussed.",
    `GARAGE_CONTEXT_JSON: ${JSON.stringify(garage)}`,
  ].join("\n");
};

const isNativeTimeoutError = (error) =>
  error?.name === "AbortError" || error?.name === "TimeoutError";

const normalizeGeminiError = (error) => {
  if (error instanceof ProviderError) {
    return error;
  }

  const upstreamStatus = error instanceof ApiError ? error.status : undefined;

  if (timeoutStatuses.has(upstreamStatus) || isNativeTimeoutError(error)) {
    return new ProviderError(PROVIDER_ERROR_CODES.TIMEOUT, {
      cause: error,
      upstreamStatus,
    });
  }

  if (configurationStatuses.has(upstreamStatus)) {
    return new ProviderError(PROVIDER_ERROR_CODES.CONFIGURATION, {
      cause: error,
      upstreamStatus,
    });
  }

  return new ProviderError(PROVIDER_ERROR_CODES.UNAVAILABLE, {
    cause: error,
    upstreamStatus,
  });
};

export const createGeminiClient = ({ apiKey }) => new GoogleGenAI({ apiKey });

export const createGeminiProvider = ({ client, model, timeoutMs }) => ({
  async generateResponse({ messages, garage }) {
    const contents = messages.map(toGeminiContent);
    const systemInstruction = createGarageSystemInstruction(garage);

    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          httpOptions: { timeout: timeoutMs },
        },
      });

      return {
        content: getResponseContent(response),
      };
    } catch (error) {
      throw normalizeGeminiError(error);
    }
  },
});
