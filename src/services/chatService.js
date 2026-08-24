import mongoose from "mongoose";
import {
  appendMessageToConversationWithDetails,
  createConversation,
} from "../models/conversationModel.js";
import { chatProvider } from "./ai/provider.js";
import { toolExecutor } from "./ai/toolExecutor.js";
import { runToolLoop } from "./ai/toolLoopService.js";
import { loadConversationContext } from "./conversationContextService.js";
import { loadGarageContext } from "./garageContextService.js";

const userMessageData = (message) => ({
  role: "user",
  content: message,
});

const assistantMessageData = (content) => ({
  role: "assistant",
  content,
});

const createConversationWithFirstMessage = async ({
  userId,
  title,
  primaryVehicleId,
  message,
}) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const conversation = await createConversation(
        userId,
        { title, primaryVehicleId },
        { session },
      );
      const { conversation: updatedConversation, message: userMessage } =
        await appendMessageToConversationWithDetails(
          conversation._id,
          userId,
          userMessageData(message),
          { session },
        );

      result = { conversation: updatedConversation, userMessage };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const createChatService = ({
  provider = chatProvider,
  executor = toolExecutor,
} = {}) => ({
  async sendMessage({
    userId,
    conversationId,
    title,
    primaryVehicleId,
    message,
  }) {
    let result;

    if (conversationId) {
      const { conversation, message: userMessage } =
        await appendMessageToConversationWithDetails(
          conversationId,
          userId,
          userMessageData(message),
        );

      result = { conversation, userMessage };
    } else {
      result = await createConversationWithFirstMessage({
        userId,
        title,
        primaryVehicleId,
        message,
      });
    }

    const [conversationContext, garage] = await Promise.all([
      loadConversationContext({
        conversationId: result.conversation._id,
        userId,
      }),
      loadGarageContext({
        userId,
        focusedVehicleId: result.conversation.primaryVehicleId,
      }),
    ]);
    const context = { ...conversationContext, garage };
    const assistantContent = await runToolLoop({
      provider,
      toolExecutor: executor,
      userId,
      ...context,
    });
    const { conversation, message: assistantMessage } =
      await appendMessageToConversationWithDetails(
        result.conversation._id,
        userId,
        assistantMessageData(assistantContent),
      );

    return { ...result, conversation, assistantMessage, context };
  },
});

export const { sendMessage } = createChatService();
