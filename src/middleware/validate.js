import AppError from "../utils/AppError.js";

const validate = (schema, requestProperty) => (req, res, next) => {
  const result = schema.safeParse(req[requestProperty]);

  if (!result.success) {
    return next(new AppError("Validation failed", 400, result.error.issues));
  }

  req[requestProperty] = result.data;
  next();
};

export default validate;
