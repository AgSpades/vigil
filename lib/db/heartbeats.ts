import { prisma } from "./prisma";

export async function recordHeartbeat(userId: string) {
  return prisma.heartbeat.create({
    data: { userId },
  });
}

export async function getLastHeartbeat(userId: string): Promise<Date | null> {
  const beat = await prisma.heartbeat.findFirst({
    where: { userId },
    orderBy: { checkedInAt: "desc" },
    select: { checkedInAt: true },
  });
  return beat?.checkedInAt ?? null;
}
