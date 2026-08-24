import mongoose from "mongoose";
import {
  appendMessageToConversationWithDetails,
  createConversation,
} from "../models/conversationModel.js";
import { loadConversationContext } from "./conversationContextService.js";

const userMessageData = (message) => ({
  role: "user",
  content: message,
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

export const sendMessage = async ({
  userId,
  conversationId,
  title,
  primaryVehicleId,
  message,
}) => {
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

  const context = await loadConversationContext({
    conversationId: result.conversation._id,
    userId,
  });

  return { ...result, context };
};
