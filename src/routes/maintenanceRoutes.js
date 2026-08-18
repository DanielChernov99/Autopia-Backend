import { Router } from "express";
import { getMaintenances } from "../controllers/maintenanceController.js";

const router = Router({ mergeParams: true });

router.get("/", getMaintenances);

export default router;
