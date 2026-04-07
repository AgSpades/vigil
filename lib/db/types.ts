export interface User {
  id: string;
  email: string;
  pinHash: string | null;
  lastSeenAt: Date | null;
  failedAttempts: number;
  lockUntil: Date | null;
  createdAt: Date;
}

export interface VigilConfig {
  userId: string;
  silenceDays: number;
  graceHours: number;
  demoMode: boolean;
  cibaSentAt: Date | null;
  activatedAt: Date | null;
  cancelledAt: Date | null;
}

export interface Heartbeat {
  id: number;
  userId: string;
  checkedInAt: Date;
}

export interface StagedAction {
  id: number;
  userId: string;
  triggerDays: number;
  actionType: string;
  actionConfig: Record<string, unknown> & {
    triggerMinutes?: number;
  };
  executedAt: Date | null;
  status: string;
}

export interface ContactContext {
  id: number;
  userId: string;
  contactName: string;
  contactEmail: string | null;
  relationship: string;
  context: string;
}

export interface AuditLog {
  id: number;
  userId: string;
  eventType: string;
  detail: Record<string, unknown> | null;
  occurredAt: Date;
}
