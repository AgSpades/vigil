"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckinStatus =
  | "idle"
  | "loading"
  | "done"
  | "error"
  | "locked"
  | "pin_required";

export function HeartbeatButton() {
  const router = useRouter();
  const [status, setStatus] = useState<CheckinStatus>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [setupMode, setSetupMode] = useState(false);

  function resetModal() {
    setPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorText(null);
    setSetupMode(false);
  }

  async function submitVerify(pinValue: string) {
    const res = await fetch("/api/verify-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinValue, source: "browser" }),
    });

    if (res.status === 428) {
      setStatus("pin_required");
      setSetupMode(true);
      setErrorText("Set your 4-6 digit check-in PIN first.");
      return;
    }

    if (res.status === 423) {
      setStatus("locked");
      const retryAfterSeconds = Number(res.headers.get("Retry-After") ?? 0);
      setErrorText(
        retryAfterSeconds > 0
          ? `Temporarily locked. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`
          : "Temporarily locked. Try again later.",
      );
      return;
    }

    if (res.status === 401) {
      setStatus("error");
      setErrorText("Invalid PIN. Please try again.");
      return;
    }

    if (!res.ok) {
      setStatus("error");
      setErrorText("Check-in failed. Please retry.");
      return;
    }

    setStatus("done");
    setModalOpen(false);
    resetModal();
    setTimeout(() => setStatus("idle"), 3000);
  }

  async function submitSetPin() {
    if (!/^\d{4,6}$/.test(newPin)) {
      setErrorText("PIN must be 4 to 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setErrorText("PIN confirmation does not match.");
      return;
    }

    const res = await fetch("/api/checkin-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: newPin }),
    });

    if (!res.ok) {
      setStatus("error");
      setErrorText("Unable to set PIN right now.");
      return;
    }

    setErrorText(null);
    await submitVerify(newPin);
  }

  async function handleCheckIn() {
    setModalOpen(true);
    setStatus("idle");
    setErrorText(null);
  }

  async function handleSubmit() {
    setStatus("loading");
    setErrorText(null);

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
      }
    } catch {
      setStatus("error");
      setErrorText("Check-in failed. Please retry.");
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
