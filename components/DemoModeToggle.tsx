"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DemoModeToggle({
    initialDemoMode,
}: {
    initialDemoMode: boolean;
}) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(initialDemoMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onToggle(next: boolean) {
        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ demoMode: next }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(payload.error ?? "Failed to update demo mode");
            }

            setEnabled(next);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update demo mode");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="w-full rounded-[4px] border border-vigil-borderSubtle bg-vigil-bgSec px-5 py-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-vigil-textSec">Execution Mode</p>
                    <p className="text-[14px] text-vigil-textPri font-medium">
                        {enabled ? "Demo mode ON" : "Default mode ON"}
                    </p>
                    <p
                        suppressHydrationWarning
                        className="text-[13px] text-vigil-textSec leading-relaxed"
                    >
                        Default mode respects your silence threshold before sending confirmation.
                        Demo mode bypasses threshold and confirmation prompts so due instructions execute immediately during cron runs.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onToggle(!enabled)}
                    disabled={saving}
                    className={`relative h-7 w-14 rounded-full border transition-colors ${enabled
                        ? "bg-vigil-statusAlertBg border-vigil-statusAlertBorder"
                        : "bg-vigil-bgTer border-vigil-borderSubtle"
                        } ${saving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    aria-pressed={enabled}
                    aria-label="Toggle demo mode"
                >
                    <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${enabled
                            ? "left-8 bg-vigil-statusAlert"
                            : "left-1 bg-vigil-textTer"
                            }`}
                    />
                </button>
            </div>

            {error ? (
                <p className="mt-3 text-[12px] text-vigil-statusDown">{error}</p>
            ) : null}
        </div>
    );
}
