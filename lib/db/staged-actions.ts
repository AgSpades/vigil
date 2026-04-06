import { prisma } from "./prisma";

const ACTION_TYPES_BY_SERVICE = {
  gmail: ["gmail_send"],
  drive: ["drive_archive"],
  github: ["github_transfer"],
} as const;

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
      actionConfig: data.actionConfig as any,
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

export async function cancelStagedActionById(userId: string, actionId: number) {
  const result = await prisma.stagedAction.updateMany({
    where: {
      id: actionId,
      userId,
      status: "pending",
    },
    data: { status: "cancelled" },
  });

  return result.count > 0;
}

export async function cancelPendingActionsForServices(
  userId: string,
  services: Array<keyof typeof ACTION_TYPES_BY_SERVICE>,
) {
  const actionTypes = Array.from(
    new Set(services.flatMap((service) => ACTION_TYPES_BY_SERVICE[service])),
  );

  if (actionTypes.length === 0) {
    return 0;
  }

  const result = await prisma.stagedAction.updateMany({
    where: {
      userId,
      status: "pending",
      actionType: { in: actionTypes },
    },
    data: { status: "cancelled" },
  });

  return result.count;
}
