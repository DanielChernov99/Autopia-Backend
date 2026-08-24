import { MAX_TOOL_ITERATIONS } from "../../constants/conversation.js";
import {
  PROVIDER_ERROR_CODES,
  ProviderError,
} from "./providerError.js";
import { TOOL_ERROR_CODES, ToolError } from "./toolError.js";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const assertValidToolCalls = (toolCalls) => {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    throw new ProviderError(PROVIDER_ERROR_CODES.INVALID_RESPONSE);
  }

  const ids = new Set();

  for (const toolCall of toolCalls) {
    const isValid =
      isObject(toolCall) &&
      typeof toolCall.id === "string" &&
      toolCall.id.length > 0 &&
      typeof toolCall.name === "string" &&
      toolCall.name.length > 0 &&
      isObject(toolCall.args) &&
      !ids.has(toolCall.id);

    if (!isValid) {
      throw new ProviderError(PROVIDER_ERROR_CODES.INVALID_RESPONSE);
    }

    ids.add(toolCall.id);
  }
};

export const runToolLoop = async ({
  provider,
  toolExecutor,
  userId,
  messages,
  garage,
}) => {
  const tools = toolExecutor.getToolDefinitions();
  const toolRounds = [];

  while (true) {
    const response = await provider.generateResponse({
      messages,
      garage,
      tools,
      toolRounds,
    });

    if (
      response?.type === "message" &&
      typeof response.content === "string" &&
      response.content.trim().length > 0
    ) {
      return response.content;
    }

    if (response?.type !== "tool_calls") {
      throw new ProviderError(PROVIDER_ERROR_CODES.INVALID_RESPONSE);
    }

    assertValidToolCalls(response.toolCalls);

    if (toolRounds.length >= MAX_TOOL_ITERATIONS) {
      throw new ToolError(TOOL_ERROR_CODES.ITERATION_LIMIT);
    }

    const toolResults = await Promise.all(
      response.toolCalls.map(async ({ id, name, args }) => {
        const execution = await toolExecutor.executeTool({
          name,
          args,
          userId,
        });

        return {
          toolCallId: id,
          name: execution.name,
          result: execution.result,
        };
      }),
    );

    toolRounds.push({
      toolCalls: response.toolCalls,
      toolResults,
    });
  }
};
