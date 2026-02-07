import FuelStateClass from '../../services/fuelStatus.ts';
import { fuelStateSchema, vehicleIdParamSchema, historyQuerySchema, timeRangeQuerySchema } from '../../schemas/telemetry.mjs';

/**
 * Fuel telemetry endpoints
 * @param {import('fastify').FastifyInstance} fastify
 */
async function FuelRoutes(fastify) {
  fastify.route({
    method: "GET",
    url: "/fuellevel/:vehicleId",
    schema: {
      description: "Get fuel state for a vehicle",
      params: vehicleIdParamSchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const fuelState = FuelStateClass.getCache(vehicleId);
      if (!fuelState) {
        return reply.code(404).send({
          error: "Resource not found",
          message: `No fuel state data found for vehicle '${vehicleId}'`,
          vehicleId,
          type: "fuel",
          suggestion: "Ensure telemetry data has been posted for this vehicle"
        });
      }
      return fuelState;
    },
  });

  fastify.route({
    method: "GET",
    url: "/fuellevel/:vehicleId/history",
    schema: {
      description: "Get fuel state history for a vehicle",
      params: vehicleIdParamSchema,
      querystring: historyQuerySchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const count = request.query.count;
      const history = FuelStateClass.getHistory(vehicleId, count);

      return {
        vehicleId,
        type: "fuel",
        count: history.length,
        requested: count || "all",
        data: history
      };
    },
  });

  fastify.route({
    method: "GET",
    url: "/fuellevel/:vehicleId/timerange",
    schema: {
      description: "Get fuel state data within a time range",
      params: vehicleIdParamSchema,
      querystring: timeRangeQuerySchema
    },
    handler: async (request, reply) => {
      const { vehicleId } = request.params;
      const { startTime, endTime } = request.query;
      const data = FuelStateClass.getByTimeRange(vehicleId, startTime, endTime);

      return {
        vehicleId,
        type: "fuel",
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
    url: "/fuellevel",
    schema: {
      description: "Set fuel level - accepts vehicleId and data in body",
      body: {
        type: "object",
        properties: {
          vehicleId: { type: "string" },
          data: fuelStateSchema
        },
        required: ["vehicleId", "data"]
      }
    },
    handler: async (request, reply) => {
      const { vehicleId, data } = request.body;
      FuelStateClass.setCache(vehicleId, data);
      return { status: "ok" };
    },
  });
}

export default FuelRoutes;
