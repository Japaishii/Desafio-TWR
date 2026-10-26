import type { Prisma } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { postbackSchema } from "./postbacks.schema";
import { registerPostback } from "./postbacks.service";

export async function receivePostback(request: FastifyRequest, reply: FastifyReply) {
  const input = postbackSchema.parse(request.body);
  const result = await registerPostback(input, request.body as Prisma.InputJsonValue);

  return reply.status(result === "created" ? 201 : 200).send({ result });
}
