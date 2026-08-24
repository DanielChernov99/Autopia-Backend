import mongoose from "mongoose";
import { MAX_HISTORY_MESSAGES } from "../constants/conversation.js";
import Conversation from "../db/models/Conversation.js";
import Message from "../db/models/Message.js";
import AppError from "../utils/AppError.js";
import { getVehicleByIdForOwner } from "./vehicleModel.js";

const conversationNotFound = () =>
  new AppError("Conversation not found", 404);

const findConversationByIdForUser = async (
  conversationId,
  userId,
  session,
) => {
  const query = Conversation.findOne({ _id: conversationId, userId });

  if (session) {
    query.session(session);
  }

  const conversation = await query;

  if (!conversation) {
    throw conversationNotFound();
  }

  return conversation;
};

export const createConversation = async (
  userId,
  conversationData,
  { session } = {},
) => {
  const { primaryVehicleId = null, title } = conversationData;

  if (primaryVehicleId !== null) {
    await getVehicleByIdForOwner(primaryVehicleId, userId, { session });
  }

  const conversationDataWithOwner = { userId, primaryVehicleId, title };

  if (!session) {
    return Conversation.create(conversationDataWithOwner);
  }

  const [conversation] = await Conversation.create(
    [conversationDataWithOwner],
    { session },
  );

  return conversation;
};

export const getConversationsByUser = (userId) =>
  Conversation.find({ userId }).sort({ lastMessageAt: -1 });

export const getConversationByIdForUser = (conversationId, userId) =>
  findConversationByIdForUser(conversationId, userId);

export const getMessagesByConversationForUser = async (
  conversationId,
  userId,
) => {
  const conversation = await findConversationByIdForUser(
    conversationId,
    userId,
  );

  return Message.find({ conversationId: conversation._id }).sort({
    createdAt: 1,
  });
};

export const getRecentMessagesByConversationForUser = async (
  conversationId,
  userId,
) => {
  const conversation = await findConversationByIdForUser(
    conversationId,
    userId,
  );
  const messages = await Message.find({ conversationId: conversation._id })
    .select({ role: 1, content: 1, _id: 0 })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_MESSAGES)
    .lean();

  return messages.reverse();
};

const appendMessageInSession = async (
  conversationId,
  userId,
  messageData,
  session,
) => {
  const conversation = await findConversationByIdForUser(
    conversationId,
    userId,
    session,
  );
  const { role, content } = messageData;
  const [message] = await Message.create(
    [{ conversationId: conversation._id, role, content }],
    { session },
  );

  conversation.lastMessageAt = message.createdAt;
  await conversation.save({ session });

  return { conversation, message };
};

export const appendMessageToConversationWithDetails = async (
  conversationId,
  userId,
  messageData,
  { session: existingSession } = {},
) => {
  if (existingSession) {
    return appendMessageInSession(
      conversationId,
      userId,
      messageData,
      existingSession,
    );
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      result = await appendMessageInSession(
        conversationId,
        userId,
        messageData,
        session,
      );
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const appendMessageToConversation = async (
  conversationId,
  userId,
  messageData,
) => {
  const { message } = await appendMessageToConversationWithDetails(
    conversationId,
    userId,
    messageData,
  );

  return message;
};

export const deleteConversationForUser = async (conversationId, userId) => {
  const session = await mongoose.startSession();
  let deletedConversation;

  try {
    await session.withTransaction(async () => {
      const conversation = await findConversationByIdForUser(
        conversationId,
        userId,
        session,
      );

      await Message.deleteMany({ conversationId: conversation._id }).session(
        session,
      );
      await conversation.deleteOne({ session });

      deletedConversation = conversation;
    });

    return deletedConversation;
  } finally {
    await session.endSession();
  }
};
