import { sendMessage } from "../services/chatService.js";

export const sendChatMessage = async (req, res) => {
  const { conversation, userMessage, assistantMessage } = await sendMessage({
    ...req.body,
    userId: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: { conversation, userMessage, assistantMessage },
  });
};
