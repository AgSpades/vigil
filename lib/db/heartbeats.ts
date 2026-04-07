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
    SELECT "checkedInAt" FROM "Heartbeat"
    WHERE "userId" = ${userId}
    ORDER BY "checkedInAt" DESC
    LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as Heartbeat).checkedInAt : null;
}
