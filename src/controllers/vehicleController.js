export const getVehicles = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vehicles endpoint works",
  });
};
