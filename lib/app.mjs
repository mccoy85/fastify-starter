import Fastify from "fastify";
import routes from "./routes/index.mjs";

/**
 * Build a Fastify app instance
 * This function is used for both production and testing
 * @param {object} opts - Fastify options
 * @returns {Promise<FastifyInstance>}
 */
export async function build(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? true,
    ...opts
  });

  await app.register(routes);

  return app;
}
