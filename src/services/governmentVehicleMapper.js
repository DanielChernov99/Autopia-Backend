const requiredString = (value, providerField) => {
  const normalized = value == null ? "" : String(value).trim();

  if (!normalized) {
    throw new TypeError(
      `Government vehicle record is missing required field ${providerField}`,
    );
  }

  return normalized;
};

const optionalString = (value) => {
  if (value == null) {
    return undefined;
  }

  return String(value).trim() || undefined;
};

const requiredInteger = (value, providerField) => {
  if (value == null || (typeof value === "string" && !value.trim())) {
    throw new TypeError(
      `Government vehicle record is missing required field ${providerField}`,
    );
  }

  if (typeof value !== "number" && typeof value !== "string") {
    throw new TypeError(
      `Government vehicle field ${providerField} must be an integer`,
    );
  }

  const normalized = Number(value);

  if (!Number.isInteger(normalized)) {
    throw new TypeError(
      `Government vehicle field ${providerField} must be an integer`,
    );
  }

  return normalized;
};

const optionalDate = (value, providerField) => {
  if (value == null || (typeof value === "string" && !value.trim())) {
    return undefined;
  }

  const normalized = new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    throw new TypeError(
      `Government vehicle field ${providerField} must be a valid date`,
    );
  }

  return normalized;
};

export const mapGovernmentVehicleRecord = (record) => {
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    throw new TypeError("Government vehicle record must be an object");
  }

  const licensePlate = requiredString(
    record.mispar_rechev,
    "mispar_rechev",
  ).replace(/\D/g, "");

  if (!licensePlate) {
    throw new TypeError(
      "Government vehicle field mispar_rechev must contain digits",
    );
  }

  const vehicleData = {
    licensePlate,
    manufacturer: requiredString(record.tozeret_nm, "tozeret_nm"),
    model: requiredString(record.kinuy_mishari, "kinuy_mishari"),
    year: requiredInteger(record.shnat_yitzur, "shnat_yitzur"),
    fuelType: requiredString(record.sug_delek_nm, "sug_delek_nm"),
  };

  const trimLevel = optionalString(record.ramat_gimur);
  const color = optionalString(record.tzeva_rechev);
  const vehicleLicenseValidUntil = optionalDate(record.tokef_dt, "tokef_dt");

  if (trimLevel !== undefined) {
    vehicleData.trimLevel = trimLevel;
  }

  if (color !== undefined) {
    vehicleData.color = color;
  }

  if (vehicleLicenseValidUntil !== undefined) {
    vehicleData.vehicleLicenseValidUntil = vehicleLicenseValidUntil;
  }

  vehicleData.governmentData = { raw: record };

  return vehicleData;
};
