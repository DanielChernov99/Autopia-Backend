import {
  AI_CHAT_RATE_LIMIT_MAX_REQUESTS,
  AI_CHAT_RATE_LIMIT_WINDOW_MS,
} from "../constants/conversation.js";
import AppError from "../utils/AppError.js";

const rateLimitError = () =>
  new AppError("Too many AI chat requests. Please try again later.", 429);

const createAiChatRateLimit = ({
  windowMs = AI_CHAT_RATE_LIMIT_WINDOW_MS,
  maxRequests = AI_CHAT_RATE_LIMIT_MAX_REQUESTS,
  now = Date.now,
} = {}) => {
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new TypeError("AI chat rate-limit window must be a positive integer");
  }

  if (!Number.isSafeInteger(maxRequests) || maxRequests <= 0) {
    throw new TypeError("AI chat rate-limit maximum must be a positive integer");
  }

  if (typeof now !== "function") {
    throw new TypeError("AI chat rate-limit clock must be a function");
  }

  const stateByUserId = new Map();

  return (req, res, next) => {
    const userId = req.user?._id ?? req.user?.id;

    if (userId === undefined || userId === null) {
      return next(new AppError("Authentication required", 401));
    }

    const timestamp = now();

    for (const [key, state] of stateByUserId) {
      if (state.resetAt <= timestamp) {
        stateByUserId.delete(key);
      }
    }

    const key = String(userId);
    const state = stateByUserId.get(key);

    if (!state) {
      stateByUserId.set(key, {
        count: 1,
        resetAt: timestamp + windowMs,
      });
      return next();
    }

    if (state.count >= maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((state.resetAt - timestamp) / 1000),
      );
      res.set("Retry-After", String(retryAfterSeconds));
      return next(rateLimitError());
    }

    state.count += 1;
    return next();
  };
};

const aiChatRateLimit = createAiChatRateLimit();

export default aiChatRateLimit;
