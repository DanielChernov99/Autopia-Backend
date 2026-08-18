import mongoose from "mongoose";

const governmentDataSchema = new mongoose.Schema(
  {
    resourceId: String,
    fetchedAt: Date,
    raw: mongoose.Schema.Types.Mixed,
  },
  { _id: false },
);

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    fuelType: {
      type: String,
      required: true,
      trim: true,
    },
    currentMileage: {
      type: Number,
      required: true,
      min: 0,
    },
    trimLevel: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    vehicleLicenseValidUntil: Date,
    insuranceExpiryDate: Date,
    lastServiceDate: Date,
    serviceIntervalKm: {
      type: Number,
      min: 1,
      validate: Number.isInteger,
    },
    governmentData: governmentDataSchema,
  },
  { timestamps: true },
);

vehicleSchema.index({ owner: 1, licensePlate: 1 }, { unique: true });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
