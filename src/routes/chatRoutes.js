import { Router } from "express";
import { sendChatMessage } from "../controllers/chatController.js";
import {
  addConversation,
  addMessage,
  deleteConversation,
  getConversation,
  getConversations,
} from "../controllers/conversationController.js";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import {
  chatMessageSchema,
  conversationCreationSchema,
  conversationParamsSchema,
  messageCreationSchema,
} from "../validators/conversationSchemas.js";

const router = Router();

router.use(protect);

router.post("/", validate(chatMessageSchema), sendChatMessage);
router.post(
  "/conversations",
  validate(conversationCreationSchema),
  addConversation,
);
router.get("/conversations", getConversations);
router.get(
  "/conversations/:conversationId",
  validate(conversationParamsSchema, "params"),
  getConversation,
);
router.post(
  "/conversations/:conversationId/messages",
  validate(conversationParamsSchema, "params"),
  validate(messageCreationSchema),
  addMessage,
);
router.delete(
  "/conversations/:conversationId",
  validate(conversationParamsSchema, "params"),
  deleteConversation,
);

export default router;
