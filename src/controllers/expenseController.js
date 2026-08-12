export const getExpenses = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expenses endpoint works",
  });
};
