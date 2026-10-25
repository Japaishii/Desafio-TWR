import Fastify from "fastify";
import { ZodError } from "zod";
import { postbackRoutes } from "./modules/postbacks/postbacks.routes";
import { reportRoutes } from "./modules/reports/reports.routes";

export function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 100 * 1024 }); // 100 KB

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "validation_error",
        issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.status(status).send({ error: "bad_request", message: (error as Error).message });
    }

    request.log.error(error);
    return reply.status(500).send({ error: "internal_error" });
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(postbackRoutes, { prefix: "/postbacks" });
  app.register(reportRoutes, { prefix: "/reports" });

  return app;
}
