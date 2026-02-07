import GeoPoseClass from '../../services/geopose.ts';
import { geoPoseSchema, vehicleIdParamSchema, historyQuerySchema, timeRangeQuerySchema } from '../../schemas/telemetry.mjs';

/**
 * GeoPose telemetry endpoints
 * @param {import('fastify').FastifyInstance} fastify
 */
async function GeoPose(fastify) {
  fastify.route({
    method: "GET",
    url: "/vehiclestate/:vehicleId",
    schema: {
      description: "Get geo pose for a vehicle",
      params: vehicleIdParamSchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const geoPose = GeoPoseClass.getCache(vehicleId);
      if (!geoPose) {
        return reply.code(404).send({
          error: "Resource not found",
          message: `No GeoPose data found for vehicle '${vehicleId}'`,
          vehicleId,
          type: "geopose",
          suggestion: "Ensure telemetry data has been posted for this vehicle"
        });
      }
      return geoPose;
    },
  });

  fastify.route({
    method: "GET",
    url: "/vehiclestate/:vehicleId/history",
    schema: {
      description: "Get geo pose history for a vehicle",
      params: vehicleIdParamSchema,
      querystring: historyQuerySchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const count = request.query.count;
      const history = GeoPoseClass.getHistory(vehicleId, count);

      // Add metadata for better developer experience
      return {
        vehicleId,
        type: "geopose",
        count: history.length,
        requested: count || "all",
        data: history
      };
    },
  });

  fastify.route({
    method: "GET",
    url: "/vehiclestate/:vehicleId/timerange",
    schema: {
      description: "Get geo pose data within a time range",
      params: vehicleIdParamSchema,
      querystring: timeRangeQuerySchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const { startTime, endTime } = request.query;
      const data = GeoPoseClass.getByTimeRange(vehicleId, startTime, endTime);

      // Add metadata for better developer experience
      return {
        vehicleId,
        type: "geopose",
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
    url: "/vehiclestate",
    schema: {
      description: "Set vehicle state (GeoPose) - accepts vehicleId and data in body",
      body: {
        type: "object",
        properties: {
          vehicleId: { type: "string" },
          data: geoPoseSchema
        },
        required: ["vehicleId", "data"]
      }
    },
    handler: async (request, reply) => {
      const { vehicleId, data } = request.body;
      GeoPoseClass.setCache(vehicleId, data);
      return { status: "ok" };
    },
  });
}

export default GeoPose;