import mongoose from "mongoose";
import {
  appendMessageToConversationWithDetails,
  createConversation,
} from "../models/conversationModel.js";

const userMessageData = (message) => ({
  role: "user",
  content: message,
});

export const sendMessage = async ({
  userId,
  conversationId,
  title,
  primaryVehicleId,
  message,
}) => {
  if (conversationId) {
    const { conversation, message: userMessage } =
      await appendMessageToConversationWithDetails(
        conversationId,
        userId,
        userMessageData(message),
      );

    return { conversation, userMessage };
  }

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
