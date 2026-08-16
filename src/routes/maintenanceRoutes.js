import { Router } from "express";
import { getMaintenance } from "../controllers/maintenanceController.js";

const router = Router({ mergeParams: true });

router.get("/", getMaintenance);

export default router;
