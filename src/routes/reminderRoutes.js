import { Router } from "express";
import { getReminders } from "../controllers/reminderController.js";

const router = Router({ mergeParams: true });

router.get("/", getReminders);

export default router;
