import mongoose from "mongoose";
import {
  appendMessageToConversationWithDetails,
  createConversation,
} from "../models/conversationModel.js";
import { getVehicleByIdForOwner } from "../models/vehicleModel.js";
import { chatProvider } from "./ai/provider.js";
import { toolExecutor } from "./ai/toolExecutor.js";
import { runToolLoop } from "./ai/toolLoopService.js";
import { toAIFocusedVehicleSnapshot } from "./ai/vehicleMappers.js";
import { loadConversationContext } from "./conversationContextService.js";
import { loadGarageContext } from "./garageContextService.js";

const userMessageData = (message, focusedVehicle) => ({
  role: "user",
  content: message,
  ...(focusedVehicle ? { focusedVehicle } : {}),
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
  focusedVehicle,
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
          userMessageData(message, focusedVehicle),
          { session },
        );

      result = { conversation: updatedConversation, userMessage };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

const createChatService = ({
  provider = chatProvider,
  executor = toolExecutor,
  findOwnedVehicle = getVehicleByIdForOwner,
  appendMessage = appendMessageToConversationWithDetails,
  conversationContextLoader = loadConversationContext,
  garageContextLoader = loadGarageContext,
} = {}) => ({
  async sendMessage({
    userId,
    conversationId,
    title,
    primaryVehicleId,
    focusedVehicleId,
    message,
  }) {
    const hasCurrentMessageFocus = focusedVehicleId !== undefined;
    const requestedFocusId = hasCurrentMessageFocus
      ? focusedVehicleId
      : conversationId
        ? undefined
        : primaryVehicleId;
    const focusedVehicleDocument = requestedFocusId
      ? await findOwnedVehicle(requestedFocusId, userId)
      : null;
    const focusedVehicle = focusedVehicleDocument
      ? toAIFocusedVehicleSnapshot(focusedVehicleDocument)
      : null;
    let result;

    if (conversationId) {
      const { conversation, message: userMessage } =
        await appendMessage(
          conversationId,
          userId,
          userMessageData(message, focusedVehicle),
        );

      result = { conversation, userMessage };
    } else {
      result = await createConversationWithFirstMessage({
        userId,
        title,
        primaryVehicleId,
        message,
        focusedVehicle,
      });
    }

    const garageFocusId =
      requestedFocusId !== undefined
        ? requestedFocusId
        : result.conversation.primaryVehicleId;

    const [conversationContext, garage] = await Promise.all([
      conversationContextLoader({
        conversationId: result.conversation._id,
        userId,
      }),
      garageContextLoader({
        userId,
        focusedVehicleId: garageFocusId,
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
      await appendMessage(
        result.conversation._id,
        userId,
        assistantMessageData(assistantContent),
      );

    return { ...result, conversation, assistantMessage, context };
  },
});

export const { sendMessage } = createChatService();
