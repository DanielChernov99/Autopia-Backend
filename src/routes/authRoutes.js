import { Router } from "express";
import { getMe, login, signup } from "../controllers/authController.js";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import {
  userLoginSchema,
  userRegistrationSchema,
} from "../validators/userSchemas.js";

const router = Router();

router.post("/signup", validate(userRegistrationSchema), signup);
router.post("/login", validate(userLoginSchema), login);
router.get("/me", protect, getMe);

export default router;
