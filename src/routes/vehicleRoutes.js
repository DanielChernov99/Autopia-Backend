import { Router } from "express";
import protect from "../middleware/protect.js";
import {
  addVehicle,
  getVehicle,
  getVehicles,
  lookupGovernmentVehicle,
  updateVehicle,
} from "../controllers/vehicleController.js";
import validate from "../middleware/validate.js";
import {
  manualVehicleCreationSchema,
  vehicleIdParamsSchema,
  vehicleUpdateSchema,
} from "../validators/vehicleSchemas.js";
import maintenanceRoutes from "./maintenanceRoutes.js";
import reminderRoutes from "./reminderRoutes.js";

const router = Router();

router.use(protect);

router.post("/", validate(manualVehicleCreationSchema), addVehicle);
router.get("/", getVehicles);
router.get("/lookup/:licensePlate", lookupGovernmentVehicle);
router.get(
  "/:vehicleId",
  validate(vehicleIdParamsSchema, "params"),
  getVehicle,
);
router.patch(
  "/:vehicleId",
  validate(vehicleIdParamsSchema, "params"),
  validate(vehicleUpdateSchema),
  updateVehicle,
);
router.use("/:vehicleId/maintenance", maintenanceRoutes);
router.use("/:vehicleId/reminders", reminderRoutes);

export default router;
