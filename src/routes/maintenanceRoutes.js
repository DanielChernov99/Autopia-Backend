import { Router } from "express";
import {
  addMaintenance,
  deleteMaintenance,
  getMaintenance,
  getMaintenances,
  updateMaintenance,
} from "../controllers/maintenanceController.js";
import validate from "../middleware/validate.js";
import verifyVehicleOwnership from "../middleware/verifyVehicleOwnership.js";
import {
  maintenanceCreationSchema,
  maintenanceParamsSchema,
  maintenanceUpdateSchema,
} from "../validators/maintenanceSchemas.js";

const router = Router({ mergeParams: true });

router.use(verifyVehicleOwnership);

router.post("/", validate(maintenanceCreationSchema), addMaintenance);
router.get("/", getMaintenances);
router.get(
  "/:maintenanceId",
  validate(maintenanceParamsSchema, "params"),
  getMaintenance,
);
router.patch(
  "/:maintenanceId",
  validate(maintenanceParamsSchema, "params"),
  validate(maintenanceUpdateSchema),
  updateMaintenance,
);
router.delete(
  "/:maintenanceId",
  validate(maintenanceParamsSchema, "params"),
  deleteMaintenance,
);

export default router;
