import { Router } from "express";
import { getVehicles } from "../controllers/vehicleController.js";
import protect from "../middleware/protect.js";
import maintenanceRoutes from "./maintenanceRoutes.js";
import reminderRoutes from "./reminderRoutes.js";

const router = Router();

router.use(protect);

router.get("/", getVehicles);
router.use("/:vehicleId/maintenance", maintenanceRoutes);
router.use("/:vehicleId/reminders", reminderRoutes);

export default router;
