import mongoose from "mongoose";
import {
  MAINTENANCE_ACTIONS,
  MAINTENANCE_PARTS,
} from "../../constants/maintenance.js";
import {
  REMINDER_SOURCES,
  REMINDER_STATUSES,
  REMINDER_TIME_UNITS,
} from "../../constants/reminder.js";

const recurrenceTimeSchema = new mongoose.Schema(
  {
    interval: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    unit: {
      type: String,
      required: true,
      enum: REMINDER_TIME_UNITS,
    },
  },
  { _id: false },
);

const recurrenceMileageSchema = new mongoose.Schema(
  {
    interval: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
  },
  { _id: false },
);

const recurrenceSchema = new mongoose.Schema(
  {
    time: recurrenceTimeSchema,
    mileage: recurrenceMileageSchema,
  },
  { _id: false },
);

const reminderSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      enum: REMINDER_SOURCES,
    },
    notes: {
      type: String,
      trim: true,
    },
    part: {
      type: String,
      enum: MAINTENANCE_PARTS,
    },
    action: {
      type: String,
      enum: MAINTENANCE_ACTIONS,
    },
    customPart: {
      type: String,
      trim: true,
    },
    customAction: {
      type: String,
      trim: true,
    },
    dueDate: Date,
    dueMileage: {
      type: Number,
      min: 0,
    },
    recurrence: recurrenceSchema,
    systemKey: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: REMINDER_STATUSES,
      default: "active",
    },
    lastCompletedAt: Date,
  },
  { timestamps: true },
);

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
