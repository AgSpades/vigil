"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeartbeatButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function handleCheckIn() {
    setStatus("loading");
    try {
      const res = await fetch("/api/heartbeat", {
        method: "POST",
        headers: {
          "x-checkin-source": "browser",
        },
      });

      if (!res.ok) {
        throw new Error("Check-in failed");
      }

      setStatus("done");
      router.refresh();
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleCheckIn}
      disabled={status === "loading"}
      className="w-full md:w-[280px] h-[52px] bg-vigil-accentPri hover:bg-vigil-accentSec disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-vigil-textPri text-[13px] font-medium uppercase tracking-[0.12em] rounded-sm transition-colors duration-200"
    >
      {status === "loading"
        ? "Checking in..."
        : status === "done"
          ? "Accepted"
          : status === "error"
            ? "Try again"
            : "I'm here"}
    </button>
  );
}
