import { sql } from "./client";
import type { StagedAction } from "./types";

const ACTION_TYPES_BY_SERVICE = {
  gmail: ["gmail_send"],
  drive: ["drive_archive"],
  github: ["github_transfer"],
} as const;

async function resolveVisibleUserIds(
  userId: string,
  email?: string,
): Promise<string[]> {
  if (!email) {
    return [userId];
  }

  const rows = await sql`
    SELECT "id" FROM "User"
    WHERE "email" = ${email}
  `;

  return Array.from(
    new Set([userId, ...rows.map((row) => String((row as { id: string }).id))]),
  );
}

export async function saveStagedAction(data: {
  userId: string;
  triggerMinutes: number;
  actionType: string;
  actionConfig: Record<string, unknown>;
}): Promise<StagedAction> {
  const triggerMinutes = Math.max(1, Math.round(data.triggerMinutes));
  const triggerDays = Math.floor(triggerMinutes / 1_440);

  const rows = await sql`
    INSERT INTO "StagedAction" ("userId", "triggerDays", "actionType", "actionConfig", "status")
    VALUES (${data.userId}, ${triggerDays}, ${data.actionType}, ${JSON.stringify(data.actionConfig)}::jsonb, 'pending')
    RETURNING *
  `;
  return rows[0] as StagedAction;
}

function getTriggerMinutes(action: StagedAction): number {
  const fromConfig =
    action.actionConfig && typeof action.actionConfig === "object"
      ? (action.actionConfig as Record<string, unknown>).triggerMinutes
      : undefined;

  if (typeof fromConfig === "number" && Number.isFinite(fromConfig)) {
    return Math.max(1, Math.round(fromConfig));
  }

  return Math.max(1, Math.round(action.triggerDays * 1_440));
}

export async function getPendingStagedActions(
  userId: string,
  elapsedMinutes: number,
): Promise<StagedAction[]> {
  const rows = await sql`
    SELECT * FROM "StagedAction"
    WHERE "userId" = ${userId}
      AND "status" = 'pending'
    ORDER BY "triggerDays" ASC, "id" ASC
  `;

  const pending = rows as StagedAction[];
  const threshold = Math.max(0, Math.floor(elapsedMinutes));

  return pending
    .filter((action) => getTriggerMinutes(action) <= threshold)
    .sort((a, b) => getTriggerMinutes(a) - getTriggerMinutes(b));
}

export async function markActionExecuted(id: number): Promise<StagedAction> {
  const rows = await sql`
    UPDATE "StagedAction"
    SET "status" = 'executed', "executedAt" = NOW()
    WHERE "id" = ${id}
    RETURNING *
  `;
  return rows[0] as StagedAction;
}

export async function markActionFailed(id: number): Promise<StagedAction> {
  const rows = await sql`
    UPDATE "StagedAction"
    SET "status" = 'failed'
    WHERE "id" = ${id}
    RETURNING *
  `;
  return rows[0] as StagedAction;
}

export async function cancelAllActions(userId: string): Promise<number> {
  const rows = await sql`
    UPDATE "StagedAction"
    SET "status" = 'cancelled'
    WHERE "userId" = ${userId} AND "status" = 'pending'
    RETURNING "id"
  `;
  return rows.length;
}

export async function getStagedActions(
  userId: string,
  email?: string,
): Promise<StagedAction[]> {
  const visibleUserIds = await resolveVisibleUserIds(userId, email);

  const rows = await sql`
    SELECT * FROM "StagedAction"
    WHERE "userId" = ANY(${visibleUserIds})
    ORDER BY "triggerDays" ASC, "id" ASC
  `;
  return (rows as StagedAction[]).sort(
    (a, b) => getTriggerMinutes(a) - getTriggerMinutes(b),
  );
}

export async function cancelStagedActionById(
  userId: string,
  actionId: number,
  email?: string,
): Promise<boolean> {
  const visibleUserIds = await resolveVisibleUserIds(userId, email);

  const rows = await sql`
    UPDATE "StagedAction"
    SET "status" = 'cancelled'
    WHERE "id" = ${actionId}
      AND "userId" = ANY(${visibleUserIds})
      AND "status" = 'pending'
    RETURNING "id"
  `;
  return rows.length > 0;
}

export async function cancelPendingActionsForServices(
  userId: string,
  services: Array<keyof typeof ACTION_TYPES_BY_SERVICE>,
): Promise<number> {
  const actionTypes = Array.from(
    new Set(services.flatMap((service) => ACTION_TYPES_BY_SERVICE[service])),
  );

  if (actionTypes.length === 0) {
    return 0;
  }

  const rows = await sql`
    UPDATE "StagedAction"
    SET "status" = 'cancelled'
    WHERE "userId" = ${userId}
      AND "status" = 'pending'
      AND "actionType" = ANY(${actionTypes})
    RETURNING "id"
  `;
  return rows.length;
}
