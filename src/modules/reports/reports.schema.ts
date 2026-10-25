import { z } from "zod";

export const salesReportQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    platform: z.string().trim().min(1).optional(),
    product_id: z.string().trim().min(1).optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "'from' deve ser anterior ou igual a 'to'",
    path: ["from"],
  });

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
