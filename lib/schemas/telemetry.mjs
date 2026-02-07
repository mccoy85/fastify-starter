/**
 * JSON Schema definitions for telemetry types
 * These match the protobuf definitions but are JSON Schema format
 */

export const geoPoseSchema = {
  type: "object",
  properties: {
    latitude: { type: "number" },
    longitude: { type: "number" },
    altitude: { type: "number" }
  },
  required: ["latitude", "longitude", "altitude"]
};

export const diskStateSchema = {
  type: "object",
  properties: {
    totalSpace: { type: "string", description: "uint64 as string" },
    usedSpace: { type: "string", description: "uint64 as string" },
    freeSpace: { type: "string", description: "uint64 as string" }
  },
  required: ["totalSpace", "usedSpace", "freeSpace"]
};

export const fuelStateSchema = {
  type: "object",
  properties: {
    fuelLevel: { type: "number" },
    fuelConsumptionRate: { type: "number" }
  },
  required: ["fuelLevel", "fuelConsumptionRate"]
};

export const vehicleIdParamSchema = {
  type: "object",
  properties: {
    vehicleId: { type: "string" }
  },
  required: ["vehicleId"]
};

export const historyQuerySchema = {
  type: "object",
  properties: {
    count: { type: "number" }
  }
};

export const timeRangeQuerySchema = {
  type: "object",
  properties: {
    startTime: { type: "number", description: "Start timestamp in milliseconds" },
    endTime: { type: "number", description: "End timestamp in milliseconds" }
  },
  required: ["startTime", "endTime"]
};
