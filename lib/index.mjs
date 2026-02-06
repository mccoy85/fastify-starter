import Fastify from "fastify";

export const fastify = Fastify({
  logger: true,
});

fastify.register(await import("./routes/index.mjs"));
