import { sql } from "./client";
import type { Heartbeat } from "./types";

export async function recordHeartbeat(userId: string): Promise<Heartbeat> {
  const rows = await sql`
    INSERT INTO "Heartbeat" ("userId", "checkedInAt")
    VALUES (${userId}, NOW())
    RETURNING *
  `;
  return rows[0] as Heartbeat;
}

export async function getLastHeartbeat(userId: string): Promise<Date | null> {
  const rows = await sql`
    SELECT FLOOR(EXTRACT(EPOCH FROM ("checkedInAt" AT TIME ZONE 'UTC')) * 1000)::bigint AS "checkedInAtMs"
    FROM "Heartbeat"
    WHERE "userId" = ${userId}
    ORDER BY "checkedInAt" DESC
    LIMIT 1
  `;
  if (rows.length === 0) {
    return null;
  }

  const value = (rows[0] as { checkedInAtMs: string | number }).checkedInAtMs;
  const epochMs =
    typeof value === "string" ? Number.parseInt(value, 10) : value;

  return Number.isFinite(epochMs) ? new Date(epochMs) : null;
}
