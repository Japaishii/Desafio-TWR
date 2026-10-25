import type { FastifyInstance } from "fastify";
import { getSalesReport } from "./reports.controller";

export async function reportRoutes(app: FastifyInstance) {
  app.get("/sales", getSalesReport);
}
