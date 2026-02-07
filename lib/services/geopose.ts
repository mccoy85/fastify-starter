import { toBinary, toJson, fromBinary, fromJson } from "@bufbuild/protobuf";
import { GeoPoseSchema, type GeoPose } from "../types/protoTypes.ts";
import type { ITelemetryService, TelemetryEntry } from "../types/interfaces.ts";
import { TelemetryType } from "../types/protoTypes.ts";
import cacheService from "./cacheService.ts";

class GeoPoseClass implements ITelemetryService<GeoPose> {
    /**
     * Store GeoPose data in cache for a vehicle
     * @param vehicleId The vehicle identifier
     * @param pose The GeoPose data to cache
     */
    setCache(vehicleId: string, pose: GeoPose) {
        cacheService.set(vehicleId, TelemetryType.GEOPOSE, pose);
    }

    /**
     * Get the latest cached GeoPose data for a vehicle
     * @param vehicleId The vehicle identifier
     * @returns The most recent GeoPose data, or undefined if not found
     */
    getCache(vehicleId: string): GeoPose | undefined {
        const entry = cacheService.getLatest<GeoPose>(vehicleId, TelemetryType.GEOPOSE);
        return entry?.data;
    }

    /**
     * Get historical GeoPose data for a vehicle
     * @param vehicleId The vehicle identifier
     * @param count Number of historical entries to retrieve (default: all)
     * @returns Array of historical GeoPose data with timestamps
     */
    getHistory(vehicleId: string, count?: number) {
        if (count) {
            return cacheService.getLastN<GeoPose>(vehicleId, TelemetryType.GEOPOSE, count);
        }
        return cacheService.get<GeoPose>(vehicleId, TelemetryType.GEOPOSE);
    }

    /**
     * Get GeoPose data within a time range
     * @param vehicleId The vehicle identifier
     * @param startTime Start timestamp (inclusive)
     * @param endTime End timestamp (inclusive)
     * @returns Array of GeoPose data within the time range
     */
    getByTimeRange(vehicleId: string, startTime: number, endTime: number): TelemetryEntry<GeoPose>[] {
        return cacheService.getByTimeRange<GeoPose>(vehicleId, TelemetryType.GEOPOSE, startTime, endTime);
    }
}

export default new GeoPoseClass();