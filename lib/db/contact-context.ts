import { prisma } from "./prisma";

export async function saveContactContext(data: {
  userId: string;
  contactName: string;
  contactEmail?: string;
  relationship: string;
  context: string;
}) {
  return prisma.contactContext.create({ data });
}

export async function getContactContext(userId: string) {
  return prisma.contactContext.findMany({ where: { userId } });
}
