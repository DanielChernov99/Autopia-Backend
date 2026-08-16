import { GovernmentVehicleApiError } from "../services/governmentVehicleService.js";
import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  const isAppError = err instanceof AppError;
  const isGovernmentVehicleApiError = err instanceof GovernmentVehicleApiError;
  const isProduction = process.env.NODE_ENV === "production";
  let statusCode = 500;
  let message = isProduction ? "Internal server error" : err.message;

  if (isAppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (isGovernmentVehicleApiError) {
    statusCode = 503;
    message = "Government vehicle service is currently unavailable";
  }

  const response = {
    success: false,
    message,
  };

  if (isAppError && err.errors !== undefined) {
    response.errors = err.errors;
  }

  if (!isAppError && !isGovernmentVehicleApiError && !isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
