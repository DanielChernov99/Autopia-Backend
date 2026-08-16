import { z } from "zod";
import AppError from "../utils/AppError.js";

export default function validate(schema, requestProperty = "body") {
  return function (req, res, next) {
    const result = schema.safeParse(req[requestProperty]);

    if (!result.success) {
      const { formErrors, fieldErrors } = z.flattenError(result.error);

      return next(
        new AppError(formErrors[0] || "Validation failed", 400, fieldErrors),
      );
    }

    req[requestProperty] = result.data;
    next();
  };
}
