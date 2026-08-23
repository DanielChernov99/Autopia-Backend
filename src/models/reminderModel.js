import { REMINDER_FREQUENCY_MONTHS } from "../constants/reminder.js";
import Reminder from "../db/models/Reminder.js";
import AppError from "../utils/AppError.js";
import { addMonths } from "../utils/date.js";

const reminderNotFound = () => new AppError("Reminder not found", 404);

const duplicateReminderType = () =>
  new AppError("A reminder of this type already exists for this vehicle", 409);

export const createReminder = async (vehicleId, reminderData) => {
  try {
    return await Reminder.create({ ...reminderData, vehicleId });
  } catch (error) {
    if (error?.code === 11000) {
      throw duplicateReminderType();
    }
    throw error;
  }
};

export const getRemindersByVehicle = (vehicleId) =>
  Reminder.find({ vehicleId }).sort({ dueDate: 1 });

export const getReminderByIdForVehicle = async (reminderId, vehicleId) => {
  const reminder = await Reminder.findOne({ _id: reminderId, vehicleId });

  if (!reminder) {
    throw reminderNotFound();
  }

  return reminder;
};

export const updateReminderForVehicle = async (
  reminderId,
  vehicleId,
  updateData,
) => {
  let reminder;

  try {
    reminder = await Reminder.findOneAndUpdate(
      { _id: reminderId, vehicleId },
      updateData,
      { new: true, runValidators: true },
    );
  } catch (error) {
    if (error?.code === 11000) {
      throw duplicateReminderType();
    }
    throw error;
  }

  if (!reminder) {
    throw reminderNotFound();
  }

  return reminder;
};

export const deleteReminderForVehicle = async (reminderId, vehicleId) => {
  const reminder = await Reminder.findOneAndDelete({
    _id: reminderId,
    vehicleId,
  });

  if (!reminder) {
    throw reminderNotFound();
  }

  return reminder;
};

export const renewReminderForVehicle = async (reminderId, vehicleId) => {
  const reminder = await Reminder.findOne({ _id: reminderId, vehicleId });

  if (!reminder) {
    throw reminderNotFound();
  }

  reminder.dueDate = addMonths(
    reminder.dueDate,
    REMINDER_FREQUENCY_MONTHS[reminder.frequency],
  );

  return reminder.save();
};
