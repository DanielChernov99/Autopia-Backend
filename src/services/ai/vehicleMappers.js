const toId = (value) => {
  const id = value?._id ?? value?.id ?? value;
  return id ? String(id) : null;
};

const toTextOrNull = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const toISODateOrNull = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toYearMonthOrNull = (value) => {
  const normalized = toTextOrNull(value);
  const match = /^(\d{4})-(\d{1,2})$/.exec(normalized ?? "");

  if (!match) {
    return null;
  }

  const [, year, monthPart] = match;
  const month = Number(monthPart);

  if (month < 1 || month > 12) {
    return null;
  }

  return `${year}-${monthPart.padStart(2, "0")}`;
};

export const toAIVehicleOverview = (vehicle) => ({
  id: toId(vehicle),
  licensePlate: toTextOrNull(vehicle.licensePlate),
  manufacturer: toTextOrNull(vehicle.manufacturer),
  model: toTextOrNull(vehicle.model),
  year: vehicle.year ?? null,
  currentMileage: vehicle.currentMileage ?? null,
  vehicleLicenseValidUntil: toISODateOrNull(
    vehicle.vehicleLicenseValidUntil,
  ),
});

export const toAIFocusedVehicleSnapshot = (vehicle) => ({
  id: toId(vehicle),
  manufacturer: toTextOrNull(vehicle.manufacturer),
  model: toTextOrNull(vehicle.model),
  licensePlate: toTextOrNull(vehicle.licensePlate),
});

export const toAIVehicleDetails = (vehicle) => {
  const rawGovernmentData = vehicle.governmentData?.raw;
  const raw =
    rawGovernmentData &&
    typeof rawGovernmentData === "object" &&
    !Array.isArray(rawGovernmentData)
      ? rawGovernmentData
      : {};

  return {
    id: toId(vehicle),
    licensePlate: toTextOrNull(vehicle.licensePlate),
    manufacturer: toTextOrNull(vehicle.manufacturer),
    model: toTextOrNull(vehicle.model),
    year: vehicle.year ?? null,
    currentMileage: vehicle.currentMileage ?? null,
    trimLevel: toTextOrNull(vehicle.trimLevel),
    fuelType: toTextOrNull(vehicle.fuelType),
    color: toTextOrNull(vehicle.color),
    vehicleLicenseValidUntil: toISODateOrNull(
      vehicle.vehicleLicenseValidUntil,
    ),
    insuranceExpiryDate: toISODateOrNull(vehicle.insuranceExpiryDate),
    lastMaintenanceDate: toISODateOrNull(vehicle.lastMaintenanceDate),
    maintenanceInterval: vehicle.maintenanceInterval ?? null,
    engineCode: toTextOrNull(raw.degem_manoa),
    safetyEquipmentLevel: raw.ramat_eivzur_betihuty ?? null,
    pollutionGroup: raw.kvutzat_zihum ?? null,
    ownershipType: toTextOrNull(raw.baalut),
    technicalModel: toTextOrNull(raw.degem_nm),
    roadRegistrationDate: toYearMonthOrNull(raw.moed_aliya_lakvish),
    frontTireSize: toTextOrNull(raw.zmig_kidmi),
    rearTireSize: toTextOrNull(raw.zmig_ahori),
    lastVehicleTestDate: toISODateOrNull(raw.mivchan_acharon_dt),
  };
};
