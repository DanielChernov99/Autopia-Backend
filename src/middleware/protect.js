import User from "../db/models/User.js";
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/tokens.js";

const BEARER_PREFIX = "Bearer ";

export default async function protect(req, res, next) {
  const authorization = req.get("authorization") || "";

  if (!authorization.startsWith(BEARER_PREFIX)) {
    return next(new AppError("Authentication required", 401));
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    return next(new AppError("Authentication token is missing", 401));
  }

  let payload;

  try {
    payload = verifyToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Authentication token has expired", 401));
    }

    return next(new AppError("Authentication token is invalid", 401));
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    return next(new AppError("Account no longer exists", 401));
  }

  req.user = user;
  next();
}
