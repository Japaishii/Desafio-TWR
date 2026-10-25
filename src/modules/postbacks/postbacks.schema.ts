import { z } from "zod";

export const postbackSchema = z.object({
  platform: z.string().trim().min(1).max(50),
  transaction_id: z.string().trim().min(1).max(100),
  status: z.enum(["pending", "approved", "refunded", "chargeback", "canceled"]),
  product_id: z.string().trim().min(1).max(100),
  product_name: z.string().trim().max(200).optional(),
  // Valor em centavos (inteiro) para evitar erro de ponto flutuante.
  amount_cents: z.number().int().nonnegative().max(2_000_000_000),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((c) => c.toUpperCase())
    .default("BRL"),
  customer_email: z.string().trim().email().max(254).optional(),
  // Horário em que o evento ocorreu na plataforma (ISO 8601 com fuso).
  occurred_at: z.string().datetime({ offset: true }).transform((d) => new Date(d)),
});

export type PostbackInput = z.infer<typeof postbackSchema>;
