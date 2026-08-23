import mongoose from "mongoose";
import {
  REMINDER_FREQUENCIES,
  REMINDER_TYPES,
} from "../../constants/reminder.js";

const reminderSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: REMINDER_TYPES,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: REMINDER_FREQUENCIES,
    },
  },
  { timestamps: true },
);

reminderSchema.index({ vehicleId: 1, dueDate: 1 });
reminderSchema.index({ vehicleId: 1, type: 1 }, { unique: true });

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
