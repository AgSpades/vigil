import { auth0 } from "../auth0";
import {
  getConnectedServicesFromAccounts,
  getConnectedServicesFromSession,
} from "../auth0-connected-accounts";
import { fetchConnectedAccounts } from "../auth0-my-account";
import { prisma } from "./prisma";

export async function upsertUser(id: string, email: string) {
  return prisma.user.upsert({
    where: { id },
    create: { id, email },
    update: { email },
  });
}

export async function getVigilConfig(userId: string) {
  return prisma.vigilConfig.findUnique({ where: { userId } });
}

export async function ensureVigilConfig(userId: string) {
  return prisma.vigilConfig.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function updateVigilConfig(
  userId: string,
  data: {
    silenceDays: number;
    graceHours: number;
  },
) {
  return prisma.vigilConfig.update({
    where: { userId },
    data,
  });
}

export async function updateCibaSentAt(userId: string) {
  return prisma.vigilConfig.update({
    where: { userId },
    data: { cibaSentAt: new Date() },
  });
}

export async function markActivated(userId: string) {
  return prisma.vigilConfig.update({
    where: { userId },
    data: { activatedAt: new Date() },
  });
}

export async function markCancelled(userId: string) {
  return prisma.vigilConfig.update({
    where: { userId },
    data: { cancelledAt: new Date() },
  });
}

export async function getAllActiveUsers(): Promise<{ id: string }[]> {
  return prisma.user.findMany({
    where: {
      config: {
        activatedAt: null,
        cancelledAt: null,
      },
    },
    select: { id: true },
  });
}

export async function getConnectedServices(userId: string): Promise<string[]> {
  void userId;
  try {
    const accounts = await fetchConnectedAccounts();
    return getConnectedServicesFromAccounts(accounts);
  } catch {
    const session = await auth0.getSession();
    return getConnectedServicesFromSession(session);
  }
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const setupConfirmation = await prisma.auditLog.findFirst({
    where: {
      userId,
      eventType: "setup_confirmed",
    },
    select: { id: true },
  });

  return Boolean(setupConfirmation);
}
