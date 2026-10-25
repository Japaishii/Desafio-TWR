import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { SalesReportQuery } from "./reports.schema";

type StatusTotals = Record<string, { count: number; amountCents: number }>;
type CurrencyReport = {
  revenueCents: number;
  byStatus: StatusTotals;
  topProducts: { productId: string; sales: number; amountCents: number }[];
};

function buildSaleWhere(query: SalesReportQuery): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {};
  if (query.from || query.to) {
    where.occurredAt = { gte: query.from, lte: query.to };
  }
  if (query.platform) where.platform = query.platform;
  if (query.product_id) where.productId = query.product_id;
  return where;
}

function getCurrencyReport(
  currencies: Record<string, CurrencyReport>,
  currency: string,
): CurrencyReport {
  return (currencies[currency] ??= { revenueCents: 0, byStatus: {}, topProducts: [] });
}

export async function buildSalesReport(query: SalesReportQuery) {
  const where = buildSaleWhere(query);
  const [byStatus, topProducts] = await Promise.all([
    prisma.sale.groupBy({
      by: ["currency", "status"],
      where,
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
    prisma.sale.groupBy({
      by: ["currency", "productId"],
      where: { ...where, status: "approved" },
      _count: { _all: true },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: "desc" } },
      take: 10,
    }),
  ]);

  const currencies: Record<string, CurrencyReport> = {};

  for (const row of byStatus) {
    const report = getCurrencyReport(currencies, row.currency);
    const amountCents = row._sum.amountCents ?? 0;
    report.byStatus[row.status] = { count: row._count._all, amountCents };
    if (row.status === "approved") report.revenueCents = amountCents;
  }

  for (const row of topProducts) {
    getCurrencyReport(currencies, row.currency).topProducts.push({
      productId: row.productId,
      sales: row._count._all,
      amountCents: row._sum.amountCents ?? 0,
    });
  }

  return {
    filters: {
      from: query.from ?? null,
      to: query.to ?? null,
      platform: query.platform ?? null,
      productId: query.product_id ?? null,
    },
    currencies,
  };
}
