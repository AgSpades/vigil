import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(
  userId: string,
  eventType: string,
  detail?: Record<string, unknown>,
) {
  return prisma.auditLog.create({
    data: {
      userId,
      eventType,
      detail: (detail ?? null) as Prisma.InputJsonValue,
    },
  });
}

export async function getAuditLogs(userId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}
