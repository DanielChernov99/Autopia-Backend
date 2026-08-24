import { sendMessage } from "../services/chatService.js";

export const sendChatMessage = async (req, res) => {
  const result = await sendMessage({
    ...req.body,
    userId: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: result,
  });
};
