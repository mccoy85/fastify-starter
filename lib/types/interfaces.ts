/**
 * Telemetry service interfaces
 */

import type { TelemetryData } from "./protoTypes.ts";

/**
 * Telemetry entry with timestamp
 */
export interface TelemetryEntry<T = TelemetryData> {
  timestamp: number;
  data: T;
}

/**
 * Interface for telemetry service classes
 * All telemetry services should implement this interface for consistency
 */
export interface ITelemetryService<T extends TelemetryData> {
  /**
   * Store telemetry data in cache
   */
  setCache(vehicleId: string, data: T): void;

  /**
   * Get the latest telemetry data from cache
   */
  getCache(vehicleId: string): T | undefined;

  /**
   * Get historical telemetry data
   */
  getHistory(vehicleId: string, count?: number): TelemetryEntry<T>[];

  /**
   * Get telemetry data within a time range
   */
  getByTimeRange(vehicleId: string, startTime: number, endTime: number): TelemetryEntry<T>[];
}
