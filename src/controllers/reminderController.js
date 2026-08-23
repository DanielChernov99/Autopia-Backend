import {
  createReminder,
  deleteReminderForVehicle,
  getReminderByIdForVehicle,
  getRemindersByVehicle,
  renewReminderForVehicle,
  updateReminderForVehicle,
} from "../models/reminderModel.js";

export const addReminder = async (req, res) => {
  const { vehicleId } = req.params;
  const reminder = await createReminder(vehicleId, req.body);

  res.status(201).json({
    success: true,
    data: { reminder },
  });
};

export const getReminders = async (req, res) => {
  const { vehicleId } = req.params;
  const reminders = await getRemindersByVehicle(vehicleId);

  res.status(200).json({
    success: true,
    data: { reminders },
  });
};

export const getReminder = async (req, res) => {
  const { vehicleId, reminderId } = req.params;
  const reminder = await getReminderByIdForVehicle(reminderId, vehicleId);

  res.status(200).json({
    success: true,
    data: { reminder },
  });
};

export const updateReminder = async (req, res) => {
  const { vehicleId, reminderId } = req.params;
  const reminder = await updateReminderForVehicle(
    reminderId,
    vehicleId,
    req.body,
  );

  res.status(200).json({
    success: true,
    data: { reminder },
  });
};

export const deleteReminder = async (req, res) => {
  const { vehicleId, reminderId } = req.params;
  await deleteReminderForVehicle(reminderId, vehicleId);

  res.status(200).json({
    success: true,
    message: "Reminder deleted",
  });
};

export const renewReminder = async (req, res) => {
  const { vehicleId, reminderId } = req.params;
  const reminder = await renewReminderForVehicle(reminderId, vehicleId);

  res.status(200).json({
    success: true,
    data: { reminder },
  });
};
