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

export async function getAllActiveUsers() {
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

export async function getConnectedServices(
  _userId: string,
): Promise<string[]> {
  // TODO: query Auth0 Management API or Token Vault to get actually connected services
  // For now return empty list until Token Vault integration is wired
  return [];
}
