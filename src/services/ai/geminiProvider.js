import { ApiError, GoogleGenAI } from "@google/genai";
import {
  PROVIDER_ERROR_CODES,
  ProviderError,
} from "./providerError.js";

const timeoutStatuses = new Set([408, 504]);
const configurationStatuses = new Set([400, 401, 403, 404]);
const applicationCountry = "Israel";
const applicationTimeZone = "Asia/Jerusalem";
const israelDateTimeFormatter = new Intl.DateTimeFormat("en-IL", {
  timeZone: applicationTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

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

const toGeminiToolDeclarations = (tools) =>
  tools.map(({ name, description, parameters }) => ({
    name,
    description,
    parametersJsonSchema: parameters,
  }));

const toGeminiToolRoundContents = ({ toolCalls, toolResults }) => [
  {
    role: "model",
    parts: toolCalls.map(({ id, name, args, providerMetadata }) => {
      const thoughtSignature = providerMetadata?.thoughtSignature;

      return {
        functionCall: { id, name, args },
        ...(typeof thoughtSignature === "string" && thoughtSignature.length > 0
          ? { thoughtSignature }
          : {}),
      };
    }),
  },
  {
    role: "user",
    parts: toolResults.map(({ toolCallId, name, result }) => ({
      functionResponse: {
        id: toolCallId,
        name,
        response: { output: result },
      },
    })),
  },
];

const getToolCalls = (response, roundNumber) => {
  const responseParts = response?.candidates?.[0]?.content?.parts;
  const functionCallParts = Array.isArray(responseParts)
    ? responseParts.filter(({ functionCall }) => functionCall)
    : [];
  const functionCalls =
    functionCallParts.length > 0
      ? functionCallParts.map(({ functionCall }) => functionCall)
      : response?.functionCalls;

  if (!Array.isArray(functionCalls) || functionCalls.length === 0) {
    return null;
  }

  return functionCalls.map(({ id, name, args }, index) => {
    if (
      typeof name !== "string" ||
      name.length === 0 ||
      (args !== undefined &&
        (args === null || typeof args !== "object" || Array.isArray(args)))
    ) {
      throw new ProviderError(PROVIDER_ERROR_CODES.INVALID_RESPONSE);
    }

    // Gemini 3 requires this opaque part-level signature on continuation.
    const thoughtSignature = functionCallParts[index]?.thoughtSignature;

    return {
      id: id ?? `tool-call-${roundNumber}-${index + 1}`,
      name,
      args: args ?? {},
      ...(typeof thoughtSignature === "string" && thoughtSignature.length > 0
        ? { providerMetadata: { thoughtSignature } }
        : {}),
    };
  });
};

const getCurrentIsraelDateTime = () => {
  const parts = Object.fromEntries(
    israelDateTimeFormatter
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );

  return {
    currentDate: `${parts.year}-${parts.month}-${parts.day}`,
    currentLocalTime: `${parts.hour}:${parts.minute}`,
  };
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
  const { currentDate, currentLocalTime } = getCurrentIsraelDateTime();

  return [
    "You are Autopia's practical vehicle assistant.",
    "Answer in the user's language and start with the practical, direct answer.",
    "For normal questions, prefer one or two short paragraphs. Give the important answer before deeper explanation and stay focused on the question.",
    "Avoid filler, repeated summaries, long introductions, and unnecessary disclaimers. Do not end every response with a generic offer to explain more; offer further detail only when the subject genuinely needs it.",
    "Prefer simple, clean formatting. Use a short list only when it materially improves readability, and avoid unnecessary headings, tables, heavy Markdown, or decorative formatting.",
    `CURRENT_DATE: ${currentDate}`,
    `CURRENT_LOCAL_TIME: ${currentLocalTime}`,
    `TIMEZONE: ${applicationTimeZone}`,
    `COUNTRY: ${applicationCountry}`,
    "Use CURRENT_DATE and CURRENT_LOCAL_TIME when reasoning about whether saved dates are recent, old, upcoming, overdue, or how much time has passed.",
    "The JSON below is current Garage Context loaded by the backend for the authenticated user.",
    "Treat Garage Context and successful tool results as authoritative data about saved vehicles. Do not invent vehicles, mileage, maintenance records, reminders, dates, or other persisted information.",
    "Only claim an action was performed when an available tool actually completed it successfully. Do not claim or promise to save, update, add, upload, create a reminder, or remind the user later unless an available tool supports and successfully performs that action.",
    "If an action is unsupported, briefly explain what the user can currently do instead.",
    "focusedVehicleId is the user's default vehicle for this conversation, not a permanent scope.",
    'When the user ambiguously refers to "my car", "the car", maintenance, mileage, service, inspection, or another vehicle-related topic, assume they mean focusedVehicleId when it is available.',
    "Do not ask which vehicle the user means when focusedVehicleId is available unless the user explicitly refers to or names another vehicle, or asks to compare vehicles.",
    "If focusedVehicleId is null and the request genuinely requires one specific vehicle, ask for clarification when necessary.",
    "The user may explicitly discuss any vehicle listed in the Garage and may also ask general automotive questions.",
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
  async generateResponse({
    messages,
    garage,
    tools = [],
    toolRounds = [],
  }) {
    const contents = [
      ...messages.map(toGeminiContent),
      ...toolRounds.flatMap(toGeminiToolRoundContents),
    ];
    const systemInstruction = createGarageSystemInstruction(garage);
    const config = {
      systemInstruction,
      httpOptions: { timeout: timeoutMs },
      ...(tools.length > 0
        ? {
            tools: [
              {
                functionDeclarations: toGeminiToolDeclarations(tools),
              },
            ],
          }
        : {}),
    };

    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });
      const toolCalls = getToolCalls(response, toolRounds.length + 1);

      if (toolCalls) {
        return {
          type: "tool_calls",
          toolCalls,
        };
      }

      return {
        type: "message",
        content: getResponseContent(response),
      };
    } catch (error) {
      throw normalizeGeminiError(error);
    }
  },
});
