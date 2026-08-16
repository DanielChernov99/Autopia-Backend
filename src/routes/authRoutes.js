import { Router } from "express";
import {
  changePassword,
  getUserInfo,
  login,
  signup,
  updateUserInfo,
} from "../controllers/authController.js";
import protect from "../middleware/protect.js";
import validate from "../middleware/validate.js";
import {
  passwordChangeSchema,
  userLoginSchema,
  userRegistrationSchema,
  userUpdateSchema,
} from "../validators/userSchemas.js";

const router = Router();

router.post("/signup", validate(userRegistrationSchema), signup);
router.post("/login", validate(userLoginSchema), login);
router.get("/userinfo", protect, getUserInfo);
router.patch("/userinfo", protect, validate(userUpdateSchema), updateUserInfo);
router.patch(
  "/password",
  protect,
  validate(passwordChangeSchema),
  changePassword,
);

export default router;
