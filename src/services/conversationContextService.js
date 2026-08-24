import { getRecentMessagesByConversationForUser } from "../models/conversationModel.js";

export const loadConversationContext = async ({ conversationId, userId }) => {
  const messages = await getRecentMessagesByConversationForUser(
    conversationId,
    userId,
  );

  return {
    messages: messages.map(({ role, content }) => ({ role, content })),
  };
};
