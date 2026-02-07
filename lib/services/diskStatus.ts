import { toBinary, toJson, fromBinary, fromJson } from "@bufbuild/protobuf";
import { DiskStateSchema, type DiskState } from "../types/protoTypes.ts";
import type { ITelemetryService, TelemetryEntry } from "../types/interfaces.ts";
import { TelemetryType } from "../types/protoTypes.ts";
import cacheService from "./cacheService.ts";

class DiskStateClass implements ITelemetryService<DiskState> {
    /**
     * Store DiskState data in cache for a vehicle
     * @param vehicleId The vehicle identifier
     * @param diskState The DiskState data to cache
     */
    setCache(vehicleId: string, diskState: DiskState) {
        cacheService.set(vehicleId, TelemetryType.DISK, diskState);
    }

    /**
     * Get the latest cached DiskState data for a vehicle
     * @param vehicleId The vehicle identifier
     * @returns The most recent DiskState data, or undefined if not found
     */
    getCache(vehicleId: string): DiskState | undefined {
        const entry = cacheService.getLatest<DiskState>(vehicleId, TelemetryType.DISK);
        return entry?.data;
    }

    /**
     * Get historical DiskState data for a vehicle
     * @param vehicleId The vehicle identifier
     * @param count Number of historical entries to retrieve (default: all)
     * @returns Array of historical DiskState data with timestamps
     */
    getHistory(vehicleId: string, count?: number) {
        if (count) {
            return cacheService.getLastN<DiskState>(vehicleId, TelemetryType.DISK, count);
        }
        return cacheService.get<DiskState>(vehicleId, TelemetryType.DISK);
    }

    /**
     * Get DiskState data within a time range
     * @param vehicleId The vehicle identifier
     * @param startTime Start timestamp (inclusive)
     * @param endTime End timestamp (inclusive)
     * @returns Array of DiskState data within the time range
     */
    getByTimeRange(vehicleId: string, startTime: number, endTime: number): TelemetryEntry<DiskState>[] {
        return cacheService.getByTimeRange<DiskState>(vehicleId, TelemetryType.DISK, startTime, endTime);
    }
}

export default new DiskStateClass();
