import AppError from "../utils/AppError.js";

const notFoundHandler = (req, res, next) => {
  next(new AppError("Route not found", 404));
};

export default notFoundHandler;
