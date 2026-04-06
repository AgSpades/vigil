"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AuditEntry = {
    id: number;
    eventType: string;
    detail: unknown;
    occurredAt: string | Date;
};

function formatTimestamp(value: string | Date): string {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(new Date(value));
}

function formatAuditDetail(detail: unknown): string | null {
    if (!detail || typeof detail !== "object") {
        return null;
    }

    const entries = Object.entries(detail as Record<string, unknown>).filter(
        ([, value]) => value !== null && value !== undefined && value !== "",
    );

    if (entries.length === 0) {
        return null;
    }

    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" • ");
}

export function LiveAuditLog({
    initialLogs,
    refreshMs = 3000,
}: {
    initialLogs: AuditEntry[];
    refreshMs?: number;
}) {
    const [logs, setLogs] = useState<AuditEntry[]>(initialLogs);
    const [error, setError] = useState<string | null>(null);
    const latestIdRef = useRef<number>(initialLogs[0]?.id ?? 0);

    useEffect(() => {
        let cancelled = false;

        async function refreshLogs() {
            try {
                const response = await fetch("/api/audit", {
                    method: "GET",
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Failed to refresh audit log");
                }

                const payload = (await response.json()) as AuditEntry[];
                if (cancelled || !Array.isArray(payload)) {
                    return;
                }

                const nextLatestId = payload[0]?.id ?? 0;
                if (nextLatestId !== latestIdRef.current || payload.length !== logs.length) {
                    latestIdRef.current = nextLatestId;
                    setLogs(payload);
                }

                setError(null);
            } catch {
                if (!cancelled) {
                    setError("Live updates paused. Retrying...");
                }
            }
        }

        const interval = setInterval(() => {
            void refreshLogs();
        }, refreshMs);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [logs.length, refreshMs]);

    const rendered = useMemo(() => {
        if (logs.length === 0) {
            return (
                <div className="py-6 text-[13px] text-vigil-textSec">
                    No events yet.
                </div>
            );
        }

        return logs.map((log) => {
            const detail = formatAuditDetail(log.detail);
            return (
                <div
                    key={log.id}
                    className="py-4 border-b border-vigil-borderSubtle flex flex-col gap-2"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0 bg-vigil-accentPri" />
                            <span className="text-[13px] text-vigil-textPri break-words min-w-0">
                                {log.eventType.replaceAll("_", " ")}
                            </span>
                        </div>
                        <span className="text-[12px] font-mono text-vigil-textTer shrink-0">
                            {formatTimestamp(log.occurredAt)}
                        </span>
                    </div>

                    {detail ? (
                        <p className="text-[12px] text-vigil-textSec pl-5">{detail}</p>
                    ) : null}
                </div>
            );
        });
    }, [logs]);

    return (
        <div className="flex flex-col border-t border-vigil-borderSubtle">
            {error ? (
                <div className="py-3 text-[12px] text-vigil-textTer border-b border-vigil-borderSubtle">
                    {error}
                </div>
            ) : null}
            {rendered}
        </div>
    );
}
