import { auth0 } from "../auth0";
import {
  getConnectedServicesFromAccounts,
  getConnectedServicesFromSession,
} from "../auth0-connected-accounts";
import { fetchConnectedAccounts } from "../auth0-my-account";
import { sql } from "./client";
import type { User, VigilConfig } from "./types";

export async function upsertUser(id: string, email: string): Promise<User> {
  const rows = await sql`
    INSERT INTO "User" ("id", "email", "createdAt")
    VALUES (${id}, ${email}, NOW())
    ON CONFLICT ("id") DO UPDATE SET "email" = EXCLUDED."email"
    RETURNING *
  `;
  return rows[0] as User;
}

export async function getVigilConfig(
  userId: string,
): Promise<VigilConfig | null> {
  const rows = await sql`
    SELECT * FROM "VigilConfig" WHERE "userId" = ${userId} LIMIT 1
  `;
  return (rows[0] as VigilConfig) ?? null;
}

export async function ensureVigilConfig(userId: string): Promise<VigilConfig> {
  const rows = await sql`
    INSERT INTO "VigilConfig" ("userId", "silenceDays", "graceHours", "demoMode")
    VALUES (${userId}, 7, 24, false)
    ON CONFLICT ("userId") DO NOTHING
    RETURNING *
  `;
  if (rows.length > 0) {
    return rows[0] as VigilConfig;
  }
  const existing = await sql`
    SELECT * FROM "VigilConfig" WHERE "userId" = ${userId} LIMIT 1
  `;
  return existing[0] as VigilConfig;
}

export async function updateVigilConfig(
  userId: string,
  data: {
    silenceDays: number;
    graceHours: number;
    demoMode?: boolean;
  },
): Promise<VigilConfig> {
  const rows = await sql`
    UPDATE "VigilConfig"
    SET
      "silenceDays" = ${data.silenceDays},
      "graceHours" = ${data.graceHours},
      "demoMode" = COALESCE(${data.demoMode ?? null}, "demoMode")
    WHERE "userId" = ${userId}
    RETURNING *
  `;
  return rows[0] as VigilConfig;
}

export async function updateDemoMode(
  userId: string,
  demoMode: boolean,
): Promise<VigilConfig> {
  const rows = await sql`
    UPDATE "VigilConfig"
    SET "demoMode" = ${demoMode}
    WHERE "userId" = ${userId}
    RETURNING *
  `;
  return rows[0] as VigilConfig;
}

export async function resetVigilState(userId: string): Promise<VigilConfig> {
  const rows = await sql`
    UPDATE "VigilConfig"
    SET
      "cibaSentAt" = NULL,
      "activatedAt" = NULL,
      "cancelledAt" = NULL
    WHERE "userId" = ${userId}
    RETURNING *
  `;
  return rows[0] as VigilConfig;
}

export async function updateCibaSentAt(userId: string): Promise<VigilConfig> {
  const rows = await sql`
    UPDATE "VigilConfig"
    SET "cibaSentAt" = NOW()
    WHERE "userId" = ${userId}
    RETURNING *
  `;
  return rows[0] as VigilConfig;
}

export async function markActivated(userId: string): Promise<VigilConfig> {
  const rows = await sql`
    UPDATE "VigilConfig"
    SET "activatedAt" = NOW()
    WHERE "userId" = ${userId}
    RETURNING *
  `;
  return rows[0] as VigilConfig;
}

export async function markCancelled(userId: string): Promise<VigilConfig> {
  const rows = await sql`
    UPDATE "VigilConfig"
    SET "cancelledAt" = NOW()
    WHERE "userId" = ${userId}
    RETURNING *
  `;
  return rows[0] as VigilConfig;
}

export async function getAllActiveUsers(): Promise<{ id: string }[]> {
  const rows = await sql`
    SELECT u."id"
    FROM "User" u
    INNER JOIN "VigilConfig" vc ON vc."userId" = u."id"
    WHERE vc."activatedAt" IS NULL AND vc."cancelledAt" IS NULL
  `;
  return rows as { id: string }[];
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
  const rows = await sql`
    SELECT "id" FROM "AuditLog"
    WHERE "userId" = ${userId} AND "eventType" = 'setup_confirmed'
    LIMIT 1
  `;
  return rows.length > 0;
}
