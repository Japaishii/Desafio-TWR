import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { receivePostback } from "./postbacks.controller";

export async function postbackRoutes(app: FastifyInstance) {
  app.post("/", receivePostback);
}
