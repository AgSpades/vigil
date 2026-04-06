"use client";

import { useEffect } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";

type StagedActionItem = {
    id: number;
    triggerDays: number;
    actionType: string;
    actionConfig: unknown;
    status: string;
};

function formatActionType(actionType: string): string {
    const labels: Record<string, string> = {
        gmail_send: "Send email",
        drive_archive: "Archive Drive",
        github_transfer: "Transfer GitHub repo",
        webhook: "Call webhook",
    };

    return labels[actionType] ?? actionType;
}

function formatActionSummary(action: {
    actionType: string;
    actionConfig: unknown;
}): string {
    if (!action.actionConfig || typeof action.actionConfig !== "object") {
        return formatActionType(action.actionType);
    }

    const config = action.actionConfig as Record<string, unknown>;

    if (action.actionType === "gmail_send") {
        const to = typeof config.to === "string" ? config.to : "a contact";
        const subject =
            typeof config.subject === "string" ? ` with subject \"${config.subject}\"` : "";
        return `Email ${to}${subject}.`;
    }

    if (action.actionType === "drive_archive") {
        const targetEmail =
            typeof config.targetEmail === "string" ? config.targetEmail : "a contact";
        return `Create a Drive archive and share it with ${targetEmail}.`;
    }

    if (action.actionType === "github_transfer") {
        const repo = typeof config.repo === "string" ? config.repo : "a repository";
        const newOwner =
            typeof config.newOwner === "string" ? config.newOwner : "the new owner";
        return `Transfer ${repo} to ${newOwner}.`;
    }

    if (action.actionType === "webhook") {
        const url = typeof config.url === "string" ? config.url : "the configured URL";
        return `POST to ${url}.`;
    }

    return formatActionType(action.actionType);
}

export function StagedActionsList({
    initialActions,
}: {
    initialActions: StagedActionItem[];
}) {
    const [actions, setActions] = useState<StagedActionItem[]>(initialActions);
    const [pendingCancelId, setPendingCancelId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const sortedActions = useMemo(
        () => [...actions].sort((a, b) => a.triggerDays - b.triggerDays),
        [actions],
    );

    useEffect(() => {
        let cancelled = false;

        async function refreshActions() {
            try {
                const response = await fetch("/api/staged-actions", {
                    method: "GET",
                    cache: "no-store",
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as {
                    actions?: StagedActionItem[];
                };

                if (!cancelled && Array.isArray(payload.actions)) {
                    setActions(payload.actions);
                }
            } catch {
                // Ignore transient polling failures.
            }
        }

        const interval = setInterval(() => {
            void refreshActions();
        }, 3000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    async function cancelAction(actionId: number) {
        setPendingCancelId(actionId);
        setError(null);

        try {
            const response = await fetch(`/api/staged-actions/${actionId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => ({}))) as {
                    error?: string;
                };
                throw new Error(payload.error ?? "Failed to cancel action");
            }

            setActions((current) =>
                current.map((action) =>
                    action.id === actionId ? { ...action, status: "cancelled" } : action,
                ),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to cancel action");
        } finally {
            setPendingCancelId(null);
        }
    }

    if (sortedActions.length === 0) {
        return (
            <div className="bg-vigil-bgSec border border-dashed border-vigil-borderSubtle rounded-[4px] px-5 py-8 text-center text-[13px] text-vigil-textSec">
                No instructions saved yet.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {error ? (
                <div className="rounded-[2px] border border-vigil-statusDownBorder bg-vigil-statusDownBg px-4 py-3 text-[12px] text-vigil-textPri">
                    {error}
                </div>
            ) : null}

            {sortedActions.map((action) => {
                const canCancel = action.status === "pending";

                return (
                    <div
                        key={action.id}
                        className="bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                        <span className="text-[13px] uppercase tracking-[0.1em] text-vigil-textSec w-32 shrink-0">
                            AFTER {action.triggerDays} DAY
                            {action.triggerDays === 1 ? "" : "S"}
                        </span>
                        <span className="text-[14px] text-vigil-textPri font-light flex-grow break-words min-w-0">
                            {formatActionSummary(action)}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-1 bg-vigil-bgTer border border-vigil-borderSubtle text-[11px] text-vigil-textSec rounded-[2px] uppercase tracking-[0.08em]">
                                {action.status}
                            </span>

                            {canCancel ? (
                                <Button
                                    type="button"
                                    variant="danger-ghost"
                                    disabled={pendingCancelId === action.id}
                                    className="!h-[34px] !px-4 text-[11px]"
                                    onClick={() => cancelAction(action.id)}
                                >
                                    {pendingCancelId === action.id ? "Cancelling" : "Cancel"}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
