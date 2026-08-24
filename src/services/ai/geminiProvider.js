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
    "focusedVehicleId is the user's default vehicle for this conversation, not a permanent scope.",
    'When the user ambiguously refers to "my car", "the car", maintenance, mileage, service, inspection, or another vehicle-related topic, assume they mean focusedVehicleId when it is available.',
    "Do not ask which vehicle the user means when focusedVehicleId is available unless the user explicitly refers to or names another vehicle, or asks to compare vehicles.",
    "If focusedVehicleId is null and the request genuinely requires one specific vehicle, ask for clarification when necessary.",
    "The user may explicitly discuss any vehicle listed in the Garage.",
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
