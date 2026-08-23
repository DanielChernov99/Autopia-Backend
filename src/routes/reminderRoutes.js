import { Router } from "express";
import {
  addReminder,
  deleteReminder,
  getReminder,
  getReminders,
  renewReminder,
  updateReminder,
} from "../controllers/reminderController.js";
import validate from "../middleware/validate.js";
import verifyVehicleOwnership from "../middleware/verifyVehicleOwnership.js";
import {
  reminderCreationSchema,
  reminderParamsSchema,
  reminderUpdateSchema,
} from "../validators/reminderSchemas.js";

const router = Router({ mergeParams: true });

router.use(verifyVehicleOwnership);

router.post("/", validate(reminderCreationSchema), addReminder);
router.get("/", getReminders);
router.get(
  "/:reminderId",
  validate(reminderParamsSchema, "params"),
  getReminder,
);
router.patch(
  "/:reminderId",
  validate(reminderParamsSchema, "params"),
  validate(reminderUpdateSchema),
  updateReminder,
);
router.delete(
  "/:reminderId",
  validate(reminderParamsSchema, "params"),
  deleteReminder,
);
router.post(
  "/:reminderId/renew",
  validate(reminderParamsSchema, "params"),
  renewReminder,
);

export default router;
