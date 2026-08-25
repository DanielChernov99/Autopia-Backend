import { Router } from "express";
import protect from "../middleware/protect.js";
import {
  addVehicle,
  advanceVehicleMileage,
  deleteVehicle,
  getVehicle,
  getVehicles,
  lookupGovernmentVehicle,
  updateVehicle,
} from "../controllers/vehicleController.js";
import validate from "../middleware/validate.js";
import {
  governmentVehicleLookupParamsSchema,
  manualVehicleCreationSchema,
  vehicleIdParamsSchema,
  vehicleMileageAdvanceSchema,
  vehicleUpdateSchema,
} from "../validators/vehicleSchemas.js";
import maintenanceRoutes from "./maintenanceRoutes.js";
import reminderRoutes from "./reminderRoutes.js";

const router = Router();

router.use(protect);

router.post("/", validate(manualVehicleCreationSchema), addVehicle);
router.get("/", getVehicles);
router.get(
  "/lookup/:licensePlate",
  validate(governmentVehicleLookupParamsSchema, "params"),
  lookupGovernmentVehicle,
);
router.get(
  "/:vehicleId",
  validate(vehicleIdParamsSchema, "params"),
  getVehicle,
);
router.patch(
  "/:vehicleId/mileage",
  validate(vehicleIdParamsSchema, "params"),
  validate(vehicleMileageAdvanceSchema),
  advanceVehicleMileage,
);
router.patch(
  "/:vehicleId",
  validate(vehicleIdParamsSchema, "params"),
  validate(vehicleUpdateSchema),
  updateVehicle,
);
router.delete(
  "/:vehicleId",
  validate(vehicleIdParamsSchema, "params"),
  deleteVehicle,
);
router.use("/:vehicleId/maintenances", maintenanceRoutes);
router.use("/:vehicleId/reminders", reminderRoutes);

export default router;
