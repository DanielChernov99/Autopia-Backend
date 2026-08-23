import mongoose from "mongoose";
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

export const createConversation = async (userId, conversationData) => {
  const { primaryVehicleId = null, title } = conversationData;

  if (primaryVehicleId !== null) {
    await getVehicleByIdForOwner(primaryVehicleId, userId);
  }

  return Conversation.create({ userId, primaryVehicleId, title });
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

export const appendMessageToConversation = async (
  conversationId,
  userId,
  messageData,
) => {
  const session = await mongoose.startSession();
  let createdMessage;

  try {
    await session.withTransaction(async () => {
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

      createdMessage = message;
    });

    return createdMessage;
  } finally {
    await session.endSession();
  }
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
