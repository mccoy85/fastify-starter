/**
 * Register all routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function routes(fastify) {
  fastify.register(await import("./health/index.mjs"));
  fastify.register(await import("./geopose/index.mjs"));
  fastify.register(await import("./disk/index.mjs"));
  fastify.register(await import("./fuel/index.mjs"));
}

export default routes;
