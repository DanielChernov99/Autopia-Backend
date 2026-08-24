import mongoose from "mongoose";
import { MESSAGE_ROLES } from "../../constants/conversation.js";

const focusedVehicleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: MESSAGE_ROLES,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    focusedVehicle: {
      type: focusedVehicleSchema,
      immutable: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
