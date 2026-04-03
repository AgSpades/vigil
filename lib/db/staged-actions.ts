import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export async function saveStagedAction(data: {
  userId: string;
  triggerDays: number;
  actionType: string;
  actionConfig: Record<string, unknown>;
}) {
  return prisma.stagedAction.create({
    data: {
      userId: data.userId,
      triggerDays: data.triggerDays,
      actionType: data.actionType,
      actionConfig: data.actionConfig as Prisma.InputJsonValue,
    },
  });
}

export async function getPendingStagedActions(
  userId: string,
  silenceDays: number,
) {
  return prisma.stagedAction.findMany({
    where: {
      userId,
      status: "pending",
      triggerDays: { lte: silenceDays },
    },
    orderBy: { triggerDays: "asc" },
  });
}

export async function markActionExecuted(id: number) {
  return prisma.stagedAction.update({
    where: { id },
    data: { status: "executed", executedAt: new Date() },
  });
}

export async function markActionFailed(id: number) {
  return prisma.stagedAction.update({
    where: { id },
    data: { status: "failed" },
  });
}

export async function cancelAllActions(userId: string) {
  return prisma.stagedAction.updateMany({
    where: { userId, status: "pending" },
    data: { status: "cancelled" },
  });
}

export async function getStagedActions(userId: string) {
  return prisma.stagedAction.findMany({
    where: { userId },
    orderBy: { triggerDays: "asc" },
  });
}
