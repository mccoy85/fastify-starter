/**
 * Proto type re-exports and telemetry-related types
 */

// Re-export proto types to make them available for import from this module
export type { GeoPose } from "../msgs/protos/geopose_pb.ts";
export type { DiskState } from "../msgs/protos/disk_pb.ts";
export type { FuelState } from "../msgs/protos/fuel_pb.ts";

// Re-export proto schemas
export { GeoPoseSchema } from "../msgs/protos/geopose_pb.ts";
export { DiskStateSchema } from "../msgs/protos/disk_pb.ts";
export { FuelStateSchema } from "../msgs/protos/fuel_pb.ts";

import type { GeoPose } from "../msgs/protos/geopose_pb.ts";
import type { DiskState } from "../msgs/protos/disk_pb.ts";
import type { FuelState } from "../msgs/protos/fuel_pb.ts";

/**
 * Supported telemetry types
 */
export const TelemetryType = {
  GEOPOSE: "geopose",
  DISK: "disk",
  FUEL: "fuel",
} as const;

/**
 * Telemetry type union
 */
export type TelemetryType = typeof TelemetryType[keyof typeof TelemetryType];

/**
 * Union type for all telemetry data
 */
export type TelemetryData = GeoPose | DiskState | FuelState;
