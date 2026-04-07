import { sql } from "./client";
import type { AuditLog } from "./types";

function toAuditLog(
  row: Record<string, unknown> & { occurredAtMs?: string | number },
): AuditLog {
  const value = row.occurredAtMs;
  const epochMs =
    typeof value === "string" ? Number.parseInt(value, 10) : value;
  const occurredAt = Number.isFinite(epochMs) ? new Date(epochMs as number) : new Date(0);

  return {
    id: Number(row.id),
    userId: String(row.userId),
    eventType: String(row.eventType),
    detail:
      row.detail && typeof row.detail === "object"
        ? (row.detail as Record<string, unknown>)
        : null,
    occurredAt,
  };
}

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
    SELECT
      "id",
      "userId",
      "eventType",
      "detail",
      FLOOR(EXTRACT(EPOCH FROM ("occurredAt" AT TIME ZONE 'UTC')) * 1000)::bigint AS "occurredAtMs"
    FROM "AuditLog"
    WHERE "userId" = ${userId}
    ORDER BY "occurredAt" DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => toAuditLog(row as Record<string, unknown>));
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
