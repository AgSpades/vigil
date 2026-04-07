import { sql } from "./client";
import type { AuditLog } from "./types";

export async function logAudit(
  userId: string,
  eventType: string,
  detail?: Record<string, unknown>,
): Promise<AuditLog> {
  const rows = await sql`
    INSERT INTO "AuditLog" ("userId", "eventType", "detail", "occurredAt")
    VALUES (${userId}, ${eventType}, ${detail ? JSON.stringify(detail) : null}::jsonb, NOW())
    RETURNING *
  `;
  return rows[0] as AuditLog;
}

export async function getAuditLogs(
  userId: string,
  limit = 50,
): Promise<AuditLog[]> {
  const rows = await sql`
    SELECT * FROM "AuditLog"
    WHERE "userId" = ${userId}
    ORDER BY "occurredAt" DESC
    LIMIT ${limit}
  `;
  return rows as AuditLog[];
}

export async function getLatestCibaAuthRequestId(
  userId: string,
): Promise<string | null> {
  const rows = await sql`
    SELECT ("detail"->>'authReqId') AS "authReqId"
    FROM "AuditLog"
    WHERE "userId" = ${userId}
      AND "eventType" = 'ciba_sent'
      AND "detail" ? 'authReqId'
    ORDER BY "occurredAt" DESC
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  const value = (rows[0] as { authReqId: string | null }).authReqId;
  return value && value.length > 0 ? value : null;
}
