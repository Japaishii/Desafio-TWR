import { buildApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const app = buildApp();

async function shutdown() {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen({ port: env.PORT, host:"0.0.0.0"}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
