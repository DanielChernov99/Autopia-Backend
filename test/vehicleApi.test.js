import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import Vehicle from "../src/db/models/Vehicle.js";
import errorHandler from "../src/middleware/errorHandler.js";
import vehicleRoutes from "../src/routes/vehicleRoutes.js";

const userOneId = "64b000000000000000000001";
const userTwoId = "64b000000000000000000002";
const userOneVehicleId = "64c000000000000000000001";
const userTwoVehicleId = "64c000000000000000000002";

const originalVehicleMethods = {
  create: Vehicle.create,
  find: Vehicle.find,
  findOne: Vehicle.findOne,
  findOneAndUpdate: Vehicle.findOneAndUpdate,
};

const initialVehicles = () => [
  {
    _id: userOneVehicleId,
    owner: userOneId,
    licensePlate: "1111111",
    manufacturer: "Toyota",
    model: "Corolla",
    year: 2020,
    fuelType: "petrol",
    currentMileage: 45000,
  },
  {
    _id: userTwoVehicleId,
    owner: userTwoId,
    licensePlate: "2222222",
    manufacturer: "Honda",
    model: "Civic",
    year: 2021,
    fuelType: "petrol",
    currentMileage: 30000,
  },
];

test("vehicle management API", async (t) => {
  let vehicles = initialVehicles();
  let nextVehicleNumber = 3;

  Vehicle.create = async (vehicleData) => {
    const vehicle = {
      ...vehicleData,
      _id: `64c${String(nextVehicleNumber).padStart(21, "0")}`,
    };
    nextVehicleNumber += 1;
    vehicles.push(vehicle);
    return vehicle;
  };

  Vehicle.find = async ({ owner }) =>
    vehicles.filter((vehicle) => vehicle.owner === owner);

  Vehicle.findOne = async ({ _id, owner }) =>
    vehicles.find(
      (vehicle) => vehicle._id === _id && vehicle.owner === owner,
    ) ?? null;

  Vehicle.findOneAndUpdate = async ({ _id, owner }, updateData) => {
    const vehicle = vehicles.find(
      (candidate) => candidate._id === _id && candidate.owner === owner,
    );

    if (!vehicle) {
      return null;
    }

    Object.assign(vehicle, updateData);
    return vehicle;
  };

  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { id: req.get("x-test-user-id") ?? userOneId };
    next();
  });
  app.use("/api/vehicles", vehicleRoutes);
  app.use(errorHandler);

  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => {
      resolve(listeningServer);
    });
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/vehicles`;

  const request = (path = "", options = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        "x-test-user-id": userOneId,
        ...options.headers,
      },
    });

  t.after(async () => {
    Object.assign(Vehicle, originalVehicleMethods);
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("creates a vehicle with owner from req.user.id", async () => {
    const response = await request("", {
      method: "POST",
      body: JSON.stringify({
        licensePlate: "33-333-33",
        manufacturer: "Mazda",
        model: "3",
        year: "2022",
        fuelType: "petrol",
        currentMileage: "15000",
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.vehicle.owner, userOneId);
    assert.equal(body.data.vehicle.licensePlate, "3333333");
  });

  await t.test("rejects a client-supplied owner during creation", async () => {
    const response = await request("", {
      method: "POST",
      body: JSON.stringify({
        owner: userTwoId,
        licensePlate: "4444444",
        manufacturer: "Ford",
        model: "Focus",
        year: 2019,
        fuelType: "petrol",
        currentMileage: 60000,
      }),
    });

    assert.equal(response.status, 400);
  });

  await t.test("returns only the authenticated user's vehicles", async () => {
    const response = await request();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.data.vehicles.length >= 2);
    assert.ok(
      body.data.vehicles.every((vehicle) => vehicle.owner === userOneId),
    );
  });

  await t.test("returns an owned vehicle", async () => {
    const response = await request(`/${userOneVehicleId}`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.vehicle._id, userOneVehicleId);
  });

  await t.test("hides another user's vehicle behind a 404", async () => {
    const response = await request(`/${userTwoVehicleId}`);

    assert.equal(response.status, 404);
  });

  await t.test("partially updates an owned vehicle", async () => {
    const response = await request(`/${userOneVehicleId}`, {
      method: "PATCH",
      body: JSON.stringify({ currentMileage: 47000 }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.vehicle.currentMileage, 47000);
    assert.equal(body.data.vehicle.manufacturer, "Toyota");
  });

  await t.test("rejects an empty update", async () => {
    const response = await request(`/${userOneVehicleId}`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
  });

  await t.test("rejects forbidden update fields", async () => {
    for (const field of [
      "owner",
      "_id",
      "createdAt",
      "updatedAt",
      "governmentData",
    ]) {
      const response = await request(`/${userOneVehicleId}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: "forbidden" }),
      });

      assert.equal(response.status, 400, `${field} should be rejected`);
    }
  });

  await t.test("does not update another user's vehicle", async () => {
    const response = await request(`/${userTwoVehicleId}`, {
      method: "PATCH",
      body: JSON.stringify({ color: "blue" }),
    });

    assert.equal(response.status, 404);
    assert.equal(vehicles[1].color, undefined);
  });

  await t.test("rejects an invalid vehicle ID before data access", async () => {
    const response = await request("/not-an-object-id");

    assert.equal(response.status, 400);
  });

  await t.test("rejects an invalid request body", async () => {
    const response = await request("", {
      method: "POST",
      body: JSON.stringify({
        licensePlate: "",
        manufacturer: "",
        model: "Corolla",
        year: "not-a-year",
        fuelType: "petrol",
        currentMileage: -1,
      }),
    });

    assert.equal(response.status, 400);
  });
});
