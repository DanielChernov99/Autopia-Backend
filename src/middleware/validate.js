import { z } from "zod";
import AppError from "../utils/AppError.js";

export default function validate(schema) {
  return function (req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const { formErrors, fieldErrors } = z.flattenError(result.error);

      return next(
        new AppError(formErrors[0] || "Validation failed", 400, fieldErrors),
      );
    }

    req.body = result.data;
    next();
  };
}
