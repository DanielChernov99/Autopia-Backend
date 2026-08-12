import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  const isAppError = err instanceof AppError;
  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = isAppError ? err.statusCode : 500;

  const response = {
    success: false,
    message: isAppError || !isProduction ? err.message : "Internal server error",
  };

  if (isAppError && err.errors !== undefined) {
    response.errors = err.errors;
  }

  if (!isAppError && !isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
