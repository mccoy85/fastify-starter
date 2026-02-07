import { toBinary, toJson, fromBinary, fromJson } from "@bufbuild/protobuf";
import { FuelStateSchema, type FuelState } from "../types/protoTypes.ts";
import type { ITelemetryService, TelemetryEntry } from "../types/interfaces.ts";
import { TelemetryType } from "../types/protoTypes.ts";
import cacheService from "./cacheService.ts";

class FuelStateClass implements ITelemetryService<FuelState> {
    /**
     * Store FuelState data in cache for a vehicle
     * @param vehicleId The vehicle identifier
     * @param fuelState The FuelState data to cache
     */
    setCache(vehicleId: string, fuelState: FuelState) {
        cacheService.set(vehicleId, TelemetryType.FUEL, fuelState);
    }

    /**
     * Get the latest cached FuelState data for a vehicle
     * @param vehicleId The vehicle identifier
     * @returns The most recent FuelState data, or undefined if not found
     */
    getCache(vehicleId: string): FuelState | undefined {
        const entry = cacheService.getLatest<FuelState>(vehicleId, TelemetryType.FUEL);
        return entry?.data;
    }

    /**
     * Get historical FuelState data for a vehicle
     * @param vehicleId The vehicle identifier
     * @param count Number of historical entries to retrieve (default: all)
     * @returns Array of historical FuelState data with timestamps
     */
    getHistory(vehicleId: string, count?: number) {
        if (count) {
            return cacheService.getLastN<FuelState>(vehicleId, TelemetryType.FUEL, count);
        }
        return cacheService.get<FuelState>(vehicleId, TelemetryType.FUEL);
    }

    /**
     * Get FuelState data within a time range
     * @param vehicleId The vehicle identifier
     * @param startTime Start timestamp (inclusive)
     * @param endTime End timestamp (inclusive)
     * @returns Array of FuelState data within the time range
     */
    getByTimeRange(vehicleId: string, startTime: number, endTime: number): TelemetryEntry<FuelState>[] {
        return cacheService.getByTimeRange<FuelState>(vehicleId, TelemetryType.FUEL, startTime, endTime);
    }
}

export default new FuelStateClass();
