import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { PostbackInput } from "./postbacks.schema";

export type PostbackResult = "created" | "updated" | "ignored";

export async function registerPostback(
  input: PostbackInput,
  rawPayload: Prisma.InputJsonValue,
): Promise<PostbackResult> {
  const fields = {
    productId: input.product_id,
    productName: input.product_name ?? null,
    amountCents: input.amount_cents,
    currency: input.currency,
    status: input.status,
    customerEmail: input.customer_email ?? null,
    occurredAt: input.occurred_at,
    rawPayload,
  };

  try {
    await prisma.sale.create({
      data: { platform: input.platform, transactionId: input.transaction_id, ...fields },
    });
    return "created";
  } catch (err) {
    const isDuplicate =
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    if (!isDuplicate) throw err;
  }

  // Já existe: reentrega ou novo evento da mesma venda (ex.: approved -> refunded).
  // Só aplica se o evento for MAIS NOVO que o armazenado. A condição está no WHERE,
  // então é atômica mesmo com requisições concorrentes e eventos fora de ordem.
  const { count } = await prisma.sale.updateMany({
    where: {
      platform: input.platform,
      transactionId: input.transaction_id,
      occurredAt: { lt: input.occurred_at },
    },
    data: fields,
  });

  return count > 0 ? "updated" : "ignored";
}
