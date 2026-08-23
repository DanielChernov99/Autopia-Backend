import {
  appendMessageToConversation,
  createConversation,
  deleteConversationForUser,
  getConversationByIdForUser,
  getConversationsByUser,
  getMessagesByConversationForUser,
} from "../models/conversationModel.js";

export const addConversation = async (req, res) => {
  const conversation = await createConversation(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: { conversation },
  });
};

export const getConversations = async (req, res) => {
  const conversations = await getConversationsByUser(req.user.id);

  res.status(200).json({
    success: true,
    data: { conversations },
  });
};

export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  const conversation = await getConversationByIdForUser(
    conversationId,
    req.user.id,
  );
  const messages = await getMessagesByConversationForUser(
    conversationId,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    data: { conversation, messages },
  });
};

export const addMessage = async (req, res) => {
  const message = await appendMessageToConversation(
    req.params.conversationId,
    req.user.id,
    req.body,
  );

  res.status(201).json({
    success: true,
    data: { message },
  });
};

export const deleteConversation = async (req, res) => {
  await deleteConversationForUser(req.params.conversationId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Conversation deleted",
  });
};
