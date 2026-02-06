/**
 * Health check endpoint
 * @param {import('fastify').FastifyInstance
 */
async function routes(fastify) {
  fastify.register(await import("./health/index.mjs"));
}

export default routes;
