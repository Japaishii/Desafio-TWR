import type { FastifyReply, FastifyRequest } from "fastify";
import { salesReportQuerySchema } from "./reports.schema";
import { buildSalesReport } from "./reports.service";

export async function getSalesReport(request: FastifyRequest, reply: FastifyReply) {
  const query = salesReportQuerySchema.parse(request.query);
  return reply.send(await buildSalesReport(query));
}
