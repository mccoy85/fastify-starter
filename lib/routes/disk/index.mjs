import DiskStateClass from '../../services/diskStatus.ts';
import { diskStateSchema, vehicleIdParamSchema, historyQuerySchema, timeRangeQuerySchema } from '../../schemas/telemetry.mjs';

/**
 * Disk telemetry endpoints
 * @param {import('fastify').FastifyInstance} fastify
 */
async function DiskRoutes(fastify) {
  fastify.route({
    method: "GET",
    url: "/disk/:vehicleId",
    schema: {
      description: "Get disk state for a vehicle",
      params: vehicleIdParamSchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const diskState = DiskStateClass.getCache(vehicleId);
      if (!diskState) {
        return reply.code(404).send({
          error: "Resource not found",
          message: `No disk state data found for vehicle '${vehicleId}'`,
          vehicleId,
          type: "disk",
          suggestion: "Ensure telemetry data has been posted for this vehicle"
        });
      }
      return diskState;
    },
  });

  fastify.route({
    method: "GET",
    url: "/disk/:vehicleId/history",
    schema: {
      description: "Get disk state history for a vehicle",
      params: vehicleIdParamSchema,
      querystring: historyQuerySchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const count = request.query.count;
      const history = DiskStateClass.getHistory(vehicleId, count);

      return {
        vehicleId,
        type: "disk",
        count: history.length,
        requested: count || "all",
        data: history
      };
    },
  });

  fastify.route({
    method: "GET",
    url: "/disk/:vehicleId/timerange",
    schema: {
      description: "Get disk state data within a time range",
      params: vehicleIdParamSchema,
      querystring: timeRangeQuerySchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const { startTime, endTime } = request.query;
      const data = DiskStateClass.getByTimeRange(vehicleId, startTime, endTime);

      return {
        vehicleId,
        type: "disk",
        timeRange: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime
        },
        count: data.length,
        data
      };
    },
  });

  fastify.route({
    method: "POST",
    url: "/disk/:vehicleId",
    schema: {
      description: "Set disk state for a vehicle",
      params: vehicleIdParamSchema,
      body: diskStateSchema
    },
    handler: async (request, reply) => {
      DiskStateClass.setCache(request.params.vehicleId, request.body);
      return { status: "ok" };
    },
  });
}

export default DiskRoutes;
