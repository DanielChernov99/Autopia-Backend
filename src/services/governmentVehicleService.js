const GOVERNMENT_DATASTORE_URL =
  "https://data.gov.il/api/3/action/datastore_search";
const GOVERNMENT_VEHICLE_RESOURCE_ID =
  "053cea08-09bc-40ec-8f7a-156f0677aff3";
const REQUEST_TIMEOUT_MS = 6000;

export class GovernmentVehicleApiError extends Error {
  constructor(message, { cause, code, externalStatus } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "GovernmentVehicleApiError";
    this.code = code;

    if (externalStatus !== undefined) {
      this.externalStatus = externalStatus;
    }
  }
}

const buildLookupUrl = (licensePlate) => {
  const plate = String(licensePlate).trim();

  if (!/^\d+$/.test(plate)) {
    throw new TypeError("licensePlate must contain digits only");
  }

  const numericPlate = Number(plate);

  if (!Number.isSafeInteger(numericPlate)) {
    throw new TypeError("licensePlate must be a safe integer");
  }

  const url = new URL(GOVERNMENT_DATASTORE_URL);
  url.searchParams.set("resource_id", GOVERNMENT_VEHICLE_RESOURCE_ID);
  url.searchParams.set(
    "filters",
    JSON.stringify({ mispar_rechev: numericPlate }),
  );
  url.searchParams.set("limit", "1");

  return url;
};

const assertSuccessfulHttpResponse = (response) => {
  if (response.ok) {
    return;
  }

  throw new GovernmentVehicleApiError(
    `Government vehicle API returned status ${response.status}`,
    {
      code: "GOVERNMENT_API_HTTP_ERROR",
      externalStatus: response.status,
    },
  );
};

const parseGovernmentVehicleRecords = async (response, signal) => {
  let payload;

  try {
    payload = await response.json();
  } catch (cause) {
    if (signal.aborted) {
      throw cause;
    }

    throw new GovernmentVehicleApiError(
      "Government vehicle API returned invalid JSON",
      { cause, code: "GOVERNMENT_API_INVALID_RESPONSE" },
    );
  }

  const records = payload?.result?.records;

  if (payload?.success !== true || !Array.isArray(records)) {
    throw new GovernmentVehicleApiError(
      "Government vehicle API returned an unexpected response",
      { code: "GOVERNMENT_API_INVALID_RESPONSE" },
    );
  }

  return records;
};

export const fetchGovernmentVehicleByLicensePlate = async (licensePlate) => {
  const url = buildLookupUrl(licensePlate);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    assertSuccessfulHttpResponse(response);
    const records = await parseGovernmentVehicleRecords(
      response,
      controller.signal,
    );

    return records[0] ?? null;
  } catch (error) {
    if (error instanceof GovernmentVehicleApiError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new GovernmentVehicleApiError(
        `Government vehicle API request timed out after ${REQUEST_TIMEOUT_MS}ms`,
        { cause: error, code: "GOVERNMENT_API_TIMEOUT" },
      );
    }

    throw new GovernmentVehicleApiError(
      "Government vehicle API request failed",
      { cause: error, code: "GOVERNMENT_API_REQUEST_FAILED" },
    );
  } finally {
    clearTimeout(timeout);
  }
};
