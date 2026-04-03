"use client";

import { useState } from "react";

export function HeartbeatButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function handleCheckIn() {
    setStatus("loading");
    try {
      const res = await fetch("/api/heartbeat", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setStatus("done");
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
      className="
        w-full max-w-xs py-4 px-8 rounded-2xl text-lg font-semibold
        transition-all duration-200
        bg-emerald-600 hover:bg-emerald-500 active:scale-95
        text-white shadow-lg shadow-emerald-900/30
        disabled:opacity-60 disabled:cursor-not-allowed
      "
    >
      {status === "loading"
        ? "Checking in…"
        : status === "done"
          ? "Checked in"
          : status === "error"
            ? "Failed — try again"
            : "Check In"}
    </button>
  );
}
