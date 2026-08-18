import mongoose from "mongoose";
import {
  MAINTENANCE_ACTIONS,
  MAINTENANCE_COMPONENTS,
  MAINTENANCE_TYPES,
} from "../../constants/maintenance.js";

const maintenanceItemSchema = new mongoose.Schema(
  {
    component: {
      type: String,
      required: true,
      enum: MAINTENANCE_COMPONENTS,
    },
    customComponent: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: MAINTENANCE_ACTIONS,
    },
    customAction: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const maintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    maintenanceType: {
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
      min: 0,
    },
    garageName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    items: {
      type: [maintenanceItemSchema],
      default: undefined,
    },
  },
  { timestamps: true },
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Maintenance;
