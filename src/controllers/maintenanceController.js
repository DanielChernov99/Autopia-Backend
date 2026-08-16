export const getMaintenance = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Maintenance endpoint works",
    userId: req.user.id,
    vehicleId: req.params.vehicleId,
  });
};
