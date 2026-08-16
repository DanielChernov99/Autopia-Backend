export const getReminders = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Reminders endpoint works",
    userId: req.user.id,
    vehicleId: req.params.vehicleId,
  });
};
