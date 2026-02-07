import type { TelemetryData } from "../types/protoTypes.ts";
import type { TelemetryEntry } from "../types/interfaces.ts";
import { TelemetryType } from "../types/protoTypes.ts";


/**
 * In-memory caching service for vehicle telemetry data
 * Stores telemetry keyed by vehicleId and telemetry type
 * Values are stored as ordered arrays (by insertion time)
 */
class CacheService {
  private cache: Map<string, TelemetryEntry[]> = new Map();
  private maxEntriesPerKey: number;

  /**
   * @param maxEntriesPerKey Maximum number of telemetry entries to store per vehicle/type combination (default: 100)
   */
  constructor(maxEntriesPerKey: number = 100) {
    this.maxEntriesPerKey = maxEntriesPerKey;
  }

  /**
   * Generate cache key from vehicleId and telemetry type
   */
  private getCacheKey(vehicleId: string, type: TelemetryType): string {
    return `${vehicleId}/${type}`;
  }

  /**
   * Add telemetry data to cache
   * @param vehicleId The vehicle identifier
   * @param type The type of telemetry
   * @param data The telemetry data
   */
  set<T extends TelemetryData>(
    vehicleId: string,
    type: TelemetryType,
    data: T
  ): void {
    const key = this.getCacheKey(vehicleId, type);
    const entry: TelemetryEntry<T> = {
      timestamp: Date.now(),
      data,
    };

    const entries = this.cache.get(key) || [];
    entries.push(entry);

    // Limit the number of entries
    if (entries.length > this.maxEntriesPerKey) {
      entries.shift(); // Remove oldest entry
    }

    this.cache.set(key, entries);
  }

  /**
   * Get all telemetry entries for a vehicle and type
   * @param vehicleId The vehicle identifier
   * @param type The type of telemetry
   * @returns Array of telemetry entries ordered by insertion time (oldest first)
   */
  get<T extends TelemetryData>(
    vehicleId: string,
    type: TelemetryType
  ): TelemetryEntry<T>[] {
    const key = this.getCacheKey(vehicleId, type);
    return (this.cache.get(key) as TelemetryEntry<T>[]) || [];
  }

  /**
   * Get the latest telemetry entry for a vehicle and type
   * @param vehicleId The vehicle identifier
   * @param type The type of telemetry
   * @returns The latest telemetry entry or undefined if not found
   */
  getLatest<T extends TelemetryData>(
    vehicleId: string,
    type: TelemetryType
  ): TelemetryEntry<T> | undefined {
    const entries = this.get<T>(vehicleId, type);
    return entries.length > 0 ? entries[entries.length - 1] : undefined;
  }

  /**
   * Get telemetry entries within a time range
   * @param vehicleId The vehicle identifier
   * @param type The type of telemetry
   * @param startTime Start timestamp (inclusive)
   * @param endTime End timestamp (inclusive)
   * @returns Array of telemetry entries within the time range
   */
  getByTimeRange<T extends TelemetryData>(
    vehicleId: string,
    type: TelemetryType,
    startTime: number,
    endTime: number
  ): TelemetryEntry<T>[] {
    const entries = this.get<T>(vehicleId, type);
    return entries.filter(
      (entry) => entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Get the last N telemetry entries for a vehicle and type
   * @param vehicleId The vehicle identifier
   * @param type The type of telemetry
   * @param count Number of entries to retrieve
   * @returns Array of the last N telemetry entries
   */
  getLastN<T extends TelemetryData>(
    vehicleId: string,
    type: TelemetryType,
    count: number
  ): TelemetryEntry<T>[] {
    const entries = this.get<T>(vehicleId, type);
    return entries.slice(-count);
  }

  /**
   * Clear all telemetry for a specific vehicle and type
   * @param vehicleId The vehicle identifier
   * @param type The type of telemetry
   */
  clear(vehicleId: string, type: TelemetryType): void {
    const key = this.getCacheKey(vehicleId, type);
    this.cache.delete(key);
  }

  /**
   * Clear all telemetry for a specific vehicle (all types)
   * @param vehicleId The vehicle identifier
   */
  clearVehicle(vehicleId: string): void {
    Object.values(TelemetryType).forEach((type) => {
      this.clear(vehicleId, type as TelemetryType);
    });
  }

  /**
   * Clear all cached telemetry data
   */
  clearAll(): void {
    this.cache.clear();
  }

}

export default new CacheService();
