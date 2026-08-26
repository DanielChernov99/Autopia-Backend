import { ApiError, GoogleGenAI } from "@google/genai";
import {
  PROVIDER_ERROR_CODES,
  ProviderError,
} from "./providerError.js";
import { toAIVehicleOverview } from "./vehicleMappers.js";

const timeoutStatuses = new Set([408, 504]);
const configurationStatuses = new Set([400, 401, 403, 404]);
const transientStatuses = new Set([408, 500, 502, 503, 504]);
const transientNetworkCodes = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);
const DEFAULT_LOGICAL_REQUEST_BUDGET_MS = 55000;
const MIN_USEFUL_ATTEMPT_MS = 1000;
const PRIMARY_RETRY_DELAY_MS = 500;
const FALLBACK_RETRY_DELAY_MS = 1000;
const RETRY_JITTER_RATIO = 0.2;
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

const getToolCalls = (response, roundNumber, requestState) => {
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

    const providerMetadata = {
      model: requestState.model,
      requestStartedAt: requestState.startedAt,
      requestDeadline: requestState.deadline,
      ...(typeof thoughtSignature === "string" && thoughtSignature.length > 0
        ? { thoughtSignature }
        : {}),
    };

    return {
      id: id ?? `tool-call-${roundNumber}-${index + 1}`,
      name,
      args: args ?? {},
      providerMetadata,
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
    vehicles: vehicles.map(toAIVehicleOverview),
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

const hasTransientNetworkCode = (error) => {
  let currentError = error;

  for (let depth = 0; currentError && depth < 4; depth += 1) {
    if (transientNetworkCodes.has(currentError.code)) {
      return true;
    }

    currentError = currentError.cause;
  }

  return false;
};

const isTemporaryRateLimitError = (error) => {
  const message = error?.cause?.message;

  if (typeof message !== "string") {
    return false;
  }

  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("rate_limit_exceeded") ||
    normalizedMessage.includes("too many requests")
  ) {
    return true;
  }

  if (
    normalizedMessage.includes("daily quota") ||
    normalizedMessage.includes("per day") ||
    normalizedMessage.includes("billing") ||
    normalizedMessage.includes("spend limit") ||
    normalizedMessage.includes("quota_exceeded") ||
    normalizedMessage.includes("quota exceeded")
  ) {
    return false;
  }

  return [
    "rate limit",
    "temporar",
    "capacity",
    "overload",
    "high demand",
  ].some((marker) => normalizedMessage.includes(marker));
};

const isTransientProviderError = (error) => {
  if (!(error instanceof ProviderError)) {
    return false;
  }

  if (error.code === PROVIDER_ERROR_CODES.TIMEOUT) {
    return true;
  }

  if (error.code !== PROVIDER_ERROR_CODES.UNAVAILABLE) {
    return false;
  }

  if (error.upstreamStatus === 429) {
    return isTemporaryRateLimitError(error);
  }

  return (
    transientStatuses.has(error.upstreamStatus) ||
    hasTransientNetworkCode(error)
  );
};

const createBudgetTimeoutError = () =>
  new ProviderError(PROVIDER_ERROR_CODES.TIMEOUT, {
    cause: new Error("Gemini logical request time budget exhausted"),
  });

const getContinuationRequestState = ({
  toolRounds,
  model,
  now,
  requestBudgetMs,
}) => {
  if (toolRounds.length === 0) {
    return null;
  }

  const metadata = toolRounds[0]?.toolCalls?.[0]?.providerMetadata;
  const startedAt = Number.isFinite(metadata?.requestStartedAt)
    ? metadata.requestStartedAt
    : now();

  return {
    model:
      typeof metadata?.model === "string" && metadata.model.length > 0
        ? metadata.model
        : model,
    startedAt,
    deadline: Number.isFinite(metadata?.requestDeadline)
      ? metadata.requestDeadline
      : startedAt + requestBudgetMs,
  };
};

const getAttemptTimeoutMs = ({ deadline, now, timeoutMs }) => {
  const remainingMs = Math.floor(deadline - now());

  if (remainingMs <= 0) {
    throw createBudgetTimeoutError();
  }

  return Math.min(timeoutMs, remainingMs);
};

const hasTimeForUsefulAttempt = ({ deadline, now, timeoutMs }) =>
  deadline - now() >= Math.min(timeoutMs, MIN_USEFUL_ATTEMPT_MS);

const getRetryDelayMs = (baseDelayMs, random) => {
  const jitter = 1 - RETRY_JITTER_RATIO + random() * RETRY_JITTER_RATIO * 2;

  return Math.round(baseDelayMs * jitter);
};

const waitBeforeRetry = async ({
  baseDelayMs,
  deadline,
  now,
  random,
  sleep,
  timeoutMs,
}) => {
  if (!hasTimeForUsefulAttempt({ deadline, now, timeoutMs })) {
    return false;
  }

  const delayMs = getRetryDelayMs(baseDelayMs, random);
  const minimumAttemptMs = Math.min(timeoutMs, MIN_USEFUL_ATTEMPT_MS);

  if (deadline - now() - delayMs >= minimumAttemptMs) {
    await sleep(delayMs);
  }

  return hasTimeForUsefulAttempt({ deadline, now, timeoutMs });
};

const logProviderEvent = (logger, level, message, details) => {
  const log = logger?.[level];

  if (typeof log === "function") {
    log.call(logger, message, details);
  }
};

const toLogDetails = ({ error, model, requestState, now }) => ({
  model,
  providerError: error.code,
  upstreamStatus: error.upstreamStatus,
  elapsedMs: Math.max(0, now() - requestState.startedAt),
});

const defaultSleep = (delayMs) =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

export const createGeminiClient = ({ apiKey }) => new GoogleGenAI({ apiKey });

export const createGeminiProvider = ({
  client,
  model,
  fallbackModel,
  timeoutMs,
  requestBudgetMs = DEFAULT_LOGICAL_REQUEST_BUDGET_MS,
  now = Date.now,
  random = Math.random,
  sleep = defaultSleep,
  logger = console,
}) => ({
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
    const baseConfig = {
      systemInstruction,
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
    const continuationState = getContinuationRequestState({
      toolRounds,
      model,
      now,
      requestBudgetMs,
    });
    const startedAt = continuationState?.startedAt ?? now();
    const requestState = continuationState ?? {
      model,
      startedAt,
      deadline: startedAt + requestBudgetMs,
    };
    const requestModel = async (selectedModel) => {
      const attemptState = { ...requestState, model: selectedModel };

      try {
        const attemptTimeoutMs = getAttemptTimeoutMs({
          deadline: requestState.deadline,
          now,
          timeoutMs,
        });
        const response = await client.models.generateContent({
          model: selectedModel,
          contents,
          config: {
            ...baseConfig,
            httpOptions: { timeout: attemptTimeoutMs },
          },
        });
        const toolCalls = getToolCalls(
          response,
          toolRounds.length + 1,
          attemptState,
        );

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
    };
    const requestModelWithRetry = async ({
      selectedModel,
      retryDelayMs,
      retryMessage,
    }) => {
      try {
        return await requestModel(selectedModel);
      } catch (error) {
        if (!isTransientProviderError(error)) {
          throw error;
        }

        const canRetry = await waitBeforeRetry({
          baseDelayMs: retryDelayMs,
          deadline: requestState.deadline,
          now,
          random,
          sleep,
          timeoutMs,
        });

        if (!canRetry) {
          throw error;
        }

        logProviderEvent(
          logger,
          "warn",
          retryMessage,
          toLogDetails({
            error,
            model: selectedModel,
            requestState,
            now,
          }),
        );

        return requestModel(selectedModel);
      }
    };

    if (continuationState) {
      return requestModelWithRetry({
        selectedModel: continuationState.model,
        retryDelayMs: PRIMARY_RETRY_DELAY_MS,
        retryMessage: "Gemini continuation failed — retrying selected model",
      });
    }

    try {
      return await requestModelWithRetry({
        selectedModel: model,
        retryDelayMs: PRIMARY_RETRY_DELAY_MS,
        retryMessage: "Primary Gemini request failed — retrying",
      });
    } catch (primaryError) {
      if (
        !fallbackModel ||
        !isTransientProviderError(primaryError) ||
        !hasTimeForUsefulAttempt({
          deadline: requestState.deadline,
          now,
          timeoutMs,
        })
      ) {
        throw primaryError;
      }

      logProviderEvent(
        logger,
        "warn",
        "Primary Gemini model unavailable — attempting fallback",
        toLogDetails({
          error: primaryError,
          model,
          requestState,
          now,
        }),
      );

      try {
        const response = await requestModelWithRetry({
          selectedModel: fallbackModel,
          retryDelayMs: FALLBACK_RETRY_DELAY_MS,
          retryMessage: "Fallback Gemini request failed — retrying",
        });

        logProviderEvent(logger, "info", "Gemini fallback succeeded", {
          model: fallbackModel,
          elapsedMs: Math.max(0, now() - requestState.startedAt),
        });

        return response;
      } catch (fallbackError) {
        logProviderEvent(
          logger,
          "warn",
          "Gemini fallback failed",
          toLogDetails({
            error: fallbackError,
            model: fallbackModel,
            requestState,
            now,
          }),
        );
        throw fallbackError;
      }
    }
  },
});
