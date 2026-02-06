/**
 * Health check endpoint
 * @param {import('fastify').FastifyInstance
 */
async function health(fastify) {
  fastify.route({
    method: "GET",
    url: "/health",
    schema: {
      description: "Health check endpoint",
      tags: ["Health"],
      response: {
        200: {
          description: "Successful response",
          type: "object",
          properties: {
            status: { type: "string" },
          },
        },
      },
    },
    handler: async (request, reply) => {
      return { status: "ok" };
    },
  });
}

export default health;
