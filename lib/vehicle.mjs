// run fake vehicle data generator
import { parseArgs } from "node:util";

import { create, toBinary, toJson, fromBinary } from "@bufbuild/protobuf";
import { GeoPoseSchema } from "../lib/msgs/protos/geopose_pb.ts";
import { FuelStateSchema } from "../lib/msgs/protos/fuel_pb.ts";

const options = {
  vehicleId: {
    type: "string",
    short: "v",
    long: "vehicle-id",
    description: "ID of the vehicle",
    default: "v001",
  },
};

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options,
});

let fuelLevel = 100;
const vehicleId = values.vehicleId;
console.info("Running Vehicle ID:", vehicleId);
let i = 0;
setInterval(() => {
  i++;
  const randomLatitude = 37.7749 + (Math.random() - 0.5) * 0.01; // Random latitude around San Francisco
  const randomLongitude = -122.4194 + (Math.random() - 0.5) * 0.01; // Random longitude around San Francisco
  const randomAltitude = 30.0 + (Math.random() - 0.5) * 10; // Random altitude around 30 meters

  const vehicleData = create(GeoPoseSchema, {
    latitude: randomLatitude,
    longitude: randomLongitude,
    altitude: randomAltitude,
  });

  console.info("Vehicle Data:", vehicleData);
  fetch("http://localhost:3000/vehiclestate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vehicleId,
      data: toJson(GeoPoseSchema, vehicleData),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.info("Response from server:", data);
    })
    .catch((error) => {
      console.error("Error sending data to server:", error);
    });

  const fuelLevelData = create(FuelStateSchema, {
    level: Math.max(fuelLevel - i, 0), // Random fuel level between 0 and 100%
  });
  fetch("http://localhost:3000/fuellevel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vehicleId,
      data: toJson(FuelStateSchema, fuelLevelData),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.info("Response from server:", data);
    })
    .catch((error) => {
      console.error("Error sending data to server:", error);
    });
}, 1000); // Generate new data every second
