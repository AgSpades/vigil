"use client";

import { useEffect, useState } from "react";

type AuditEntry = {
  id: number;
  eventType: string;
  detail: Record<string, unknown> | null;
  occurredAt: string;
};

const EVENT_LABELS: Record<string, string> = {
  heartbeat: "Check-in",
  checkin_pin_set: "Check-in PIN set",
  checkin_verified: "Check-in verified",
  checkin_failed: "Check-in failed",
  ciba_sent: "Alert sent to phone",
  ciba_approved: "Alert approved",
  ciba_denied: "Alert denied — standing down",
  action_executed: "Action executed",
  action_failed: "Action failed",
  agent_cancelled: "Agent cancelled",
  setup_confirmed: "Setup confirmed",
};

const EVENT_COLORS: Record<string, string> = {
  heartbeat: "text-emerald-400",
  checkin_pin_set: "text-blue-400",
  checkin_verified: "text-emerald-400",
  checkin_failed: "text-rose-400",
  ciba_sent: "text-amber-400",
  ciba_approved: "text-blue-400",
  ciba_denied: "text-rose-400",
  action_executed: "text-emerald-400",
  action_failed: "text-rose-400",
  agent_cancelled: "text-zinc-400",
  setup_confirmed: "text-blue-400",
};

export function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="text-zinc-500 text-sm animate-pulse">
        Loading audit log…
      </div>
    );
  if (logs.length === 0)
    return <div className="text-zinc-500 text-sm">No events yet.</div>;

  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 text-sm">
          <span className="text-zinc-600 tabular-nums shrink-0 pt-0.5">
            {new Date(log.occurredAt).toLocaleString()}
          </span>
          <span
            className={`${EVENT_COLORS[log.eventType] ?? "text-zinc-300"} font-medium shrink-0`}
          >
            {EVENT_LABELS[log.eventType] ?? log.eventType}
          </span>
          {log.detail && Object.keys(log.detail).length > 0 && (
            <span className="text-zinc-500 font-mono truncate">
              {JSON.stringify(log.detail)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
