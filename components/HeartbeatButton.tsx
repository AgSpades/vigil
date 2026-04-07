"use client";

import { useState } from "react";

type CheckinStatus =
  | "idle"
  | "loading"
  | "done"
  | "error"
  | "locked"
  | "pin_required";

export function HeartbeatButton() {
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
      if (setupMode) {
        await submitSetPin();
      } else {
        await submitVerify(pin);
      }
    } catch {
      setStatus("error");
      setErrorText("Check-in failed. Please retry.");
    }
  }

  return (
    <>
      <button
        onClick={handleCheckIn}
        disabled={status === "loading"}
        className="w-full md:w-[280px] h-[52px] bg-vigil-accentPri hover:bg-vigil-accentSec disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-vigil-textPri text-[13px] font-medium uppercase tracking-[0.12em] rounded-sm transition-colors duration-200"
      >
        {status === "loading"
          ? "Verifying..."
          : status === "done"
            ? "Noted."
            : status === "locked"
              ? "Temporarily locked"
              : status === "error"
                ? "Try again"
                : "I'm here"}
      </button>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-vigil-bgSec border border-vigil-borderSubtle rounded-sm p-6 flex flex-col gap-4">
            <h3 className="text-vigil-textPri text-[16px] uppercase tracking-[0.08em]">
              {setupMode ? "Set check-in PIN" : "Enter check-in PIN"}
            </h3>

            {setupMode ? (
              <>
                <input
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="New PIN"
                  className="w-full h-11 bg-vigil-bgPri border border-vigil-borderSubtle px-3 text-vigil-textPri"
                />
                <input
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Confirm PIN"
                  className="w-full h-11 bg-vigil-bgPri border border-vigil-borderSubtle px-3 text-vigil-textPri"
                />
              </>
            ) : (
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={6}
                placeholder="4-6 digit PIN"
                className="w-full h-11 bg-vigil-bgPri border border-vigil-borderSubtle px-3 text-vigil-textPri"
              />
            )}

            {errorText ? (
              <p className="text-[12px] text-vigil-statusAlert">{errorText}</p>
            ) : null}

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetModal();
                  setStatus("idle");
                }}
                className="h-10 px-3 text-[12px] uppercase tracking-[0.08em] text-vigil-textSec"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "loading"}
                className="h-10 px-4 bg-vigil-accentPri text-vigil-textPri text-[12px] uppercase tracking-[0.08em] disabled:opacity-60"
              >
                {status === "loading"
                  ? "Verifying..."
                  : setupMode
                    ? "Set & verify"
                    : "Verify"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
