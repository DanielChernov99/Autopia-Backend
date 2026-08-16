import { Router } from "express";
import { login, signup } from "../controllers/authController.js";
import validate from "../middleware/validate.js";
import {
  userLoginSchema,
  userRegistrationSchema,
} from "../validators/userSchemas.js";

const router = Router();

router.post("/signup", validate(userRegistrationSchema), signup);
router.post("/login", validate(userLoginSchema), login);

export default router;
