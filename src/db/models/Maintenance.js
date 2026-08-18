import mongoose from "mongoose";
import {
  MAINTENANCE_PARTS,
  MAINTENANCE_TYPES,
} from "../../constants/maintenance.js";

const maintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: MAINTENANCE_TYPES,
    },
    mileageAtService: {
      type: Number,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    parts: {
      type: [String],
      enum: MAINTENANCE_PARTS,
      default: undefined,
    },
  },
  { timestamps: true },
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Maintenance;
