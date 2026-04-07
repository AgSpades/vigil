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
