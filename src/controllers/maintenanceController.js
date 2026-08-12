export const getMaintenance = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Maintenance endpoint works",
  });
};
