"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import Link from "next/link";
import { Card } from "@/components/Card";

type StatusType = "watching" | "alert" | "down";

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusType>("watching");
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = () => {
    setCheckedIn(true);
    // Visual feedback simulate
    setTimeout(() => setCheckedIn(false), 2000);
  };

  const statusMap = {
    watching: {
      text: "Vigil is watching.",
      pillText: "WATCHING",
      pillClass:
        "bg-vigil-statusWatchBg text-vigil-statusWatch border border-vigil-statusWatchBorder",
      dotClass: "bg-vigil-statusWatch animate-pulseWatch",
    },
    alert: {
      text: "Vigil has sent a confirmation.",
      pillText: "ALERT SENT",
      pillClass:
        "bg-vigil-statusAlertBg text-vigil-statusAlert border border-vigil-statusAlertBorder",
      dotClass: "bg-vigil-statusAlert animate-pulseAlert",
    },
    down: {
      text: "Vigil has stood down.",
      pillText: "STANDING DOWN",
      pillClass:
        "bg-vigil-statusDownBg text-vigil-statusDown border border-vigil-statusDownBorder",
      dotClass: "bg-vigil-statusDown",
    },
  };

  const mockInstructions = [
    { id: "1", delay: "AFTER 7 DAYS", text: "Email Anna with the estate document links and access codes.", status: "PENDING" },
    { id: "2", delay: "AFTER 8 DAYS", text: "Transfer GitHub ownership of @startup org to co-founder.", status: "PENDING" }
  ];

  const mockServices = [
    { id: "1", name: "Gmail", status: "CONNECTED" },
    { id: "2", name: "GitHub", status: "CONNECTED" }
  ];

  const mockAuditLogs = [
    { id: "1", type: "watch", text: "User check-in received", time: "14 Apr 2026, 09:41" },
    { id: "2", type: "accent", text: "Setup instructions confirmed", time: "13 Apr 2026, 12:30" },
    { id: "3", type: "watch", text: "Account connected: GitHub", time: "13 Apr 2026, 12:20" }
  ];

  return (
    <main className="min-h-[calc(100vh-72px)] bg-vigil-bgPri p-6 md:p-12 text-vigil-textPri flex justify-center fade-up relative pb-[120px]">
      {/* Dev toggle, purely to preview states as requested */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-50 bg-vigil-bgSec p-2 rounded border border-vigil-borderSubtle">
        <button
          onClick={() => setStatus("watching")}
          className="text-[10px] uppercase text-vigil-textSec hover:text-white"
        >
          Watch
        </button>
        <button
          onClick={() => setStatus("alert")}
          className="text-[10px] uppercase text-vigil-textSec hover:text-white"
        >
          Alert
        </button>
        <button
          onClick={() => setStatus("down")}
          className="text-[10px] uppercase text-vigil-textSec hover:text-white"
        >
          Down
        </button>
      </div>

      <div className="w-full max-w-[800px] flex flex-col gap-[80px]">
        {/* Status Hero */}
        <section className="flex flex-col gap-6 items-start">
          <div
            className={`px-3 py-1 flex items-center gap-2 rounded-[2px] transition-colors duration-500 delay-100 ${statusMap[status].pillClass}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${statusMap[status].dotClass}`}
            />
            <span className="text-[11px] font-sans uppercase tracking-[0.14em]">
              {statusMap[status].pillText}
            </span>
          </div>

          <h1 className="font-serif text-[40px] md:text-[56px] font-light leading-[1.1] min-h-[60px] transition-opacity duration-300">
            {statusMap[status].text}
          </h1>

          <p className="text-vigil-textSec font-mono text-[13px] mb-4">
            Last seen — 14 Apr 2026, 09:41 IST
          </p>

          <Button
            variant="primary"
            className="w-full md:w-[280px]"
            onClick={handleCheckIn}
            disabled={checkedIn}
          >
            {checkedIn ? "✓ Noted." : "I'm here"}
          </Button>
        </section>

        {/* Active Instructions */}
        <section className="flex flex-col gap-6 fade-up delay-100">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              YOUR INSTRUCTIONS
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <div className="flex flex-col gap-3">
            {mockInstructions.length > 0 ? (
              mockInstructions.map((inst, i) => (
                <Card
                  key={i}
                  padding="md"
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <span className="text-[13px] uppercase tracking-[0.1em] text-vigil-textSec w-32 shrink-0">
                    {inst.delay}
                  </span>
                  <span className="text-[14px] text-vigil-textPri font-light flex-grow break-words min-w-0">
                    {inst.text}
                  </span>
                  <span className="px-2 py-1 bg-vigil-bgTer border border-vigil-borderSubtle text-[11px] text-vigil-textSec rounded-[2px] shrink-0">
                    {inst.status}
                  </span>
                </Card>
              ))
            ) : (
              <Card padding="md" variant="dashed" className="flex items-center justify-center py-8">
                <span className="text-[13px] text-vigil-textSec">No active instructions set.</span>
              </Card>
            )}
          </div>

          <div className="flex">
            <Link href="/onboarding/setup" className="py-2 pr-4 -my-2 flex">
              <span className="text-[12px] uppercase text-vigil-textSec hover:text-vigil-accentPri border-b border-transparent hover:border-vigil-accentPri transition-colors pb-1">
                Edit instructions
              </span>
            </Link>
          </div>
        </section>

        {/* Connected Accounts */}
        <section className="flex flex-col gap-6 fade-up delay-200">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              CONNECTED SERVICES
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            {mockServices.length > 0 ? (
              mockServices.map((svc, i) => (
                <Card
                  key={i}
                  padding="sm"
                  className="w-full sm:w-[220px] flex-shrink-0 relative overflow-hidden group hover:border-vigil-statusWatch transition-colors"
                >
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-vigil-statusWatch/10 blur-xl rounded-full group-hover:bg-vigil-statusWatch/20 transition-all duration-500"></div>
                  <div className="flex flex-col gap-4 z-10 relative">
                    <span className="text-[14px] font-medium text-vigil-textPri break-words min-w-0">
                      {svc.name}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-vigil-statusWatch font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-vigil-statusWatch animate-pulseWatch"></span>{" "}
                      {svc.status}
                    </span>
                  </div>
                </Card>
              ))
            ) : (
              <Card padding="sm" variant="dashed" className="w-[220px] flex items-center justify-center py-6">
                <span className="text-[12px] text-vigil-textSec">No services connected.</span>
              </Card>
            )}

            <Card
              padding="sm"
              variant="dashed"
              interactive
              className="flex-grow min-w-full sm:min-w-[200px] flex items-center justify-center min-h-[90px]"
            >
              <span className="text-[12px] uppercase tracking-[0.1em]">
                + ADD SERVICE
              </span>
            </Card>
          </div>

          <div className="flex">
            <Link href="/dashboard/settings" className="py-2 pr-4 -my-2 flex">
              <span className="text-[12px] uppercase text-vigil-textSec hover:text-vigil-accentPri border-b border-transparent hover:border-vigil-accentPri transition-colors pb-1">
                Manage settings
              </span>
            </Link>
          </div>
        </section>

        {/* Audit Log */}
        <section className="flex flex-col gap-6 fade-up delay-300">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              AUDIT LOG
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <div className="flex flex-col border-t border-vigil-borderSubtle">
            {mockAuditLogs.length > 0 ? (
              mockAuditLogs.map((log, i) => (
                <div key={i} className="py-4 border-b border-vigil-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${log.type === "accent" ? "bg-vigil-accentPri" : "bg-vigil-statusWatch"}`}></div>
                    <span className="text-[13px] text-vigil-textPri break-words min-w-0">
                      {log.text}
                    </span>
                  </div>
                  <span className="text-[12px] font-mono text-vigil-textTer shrink-0">
                    {log.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 flex justify-center border-b border-vigil-borderSubtle">
                <span className="text-[13px] text-vigil-textTer">No recent activity.</span>
              </div>
            )}
          </div>

          <div className="w-full flex justify-center mt-4">
            <Button variant="secondary" className="w-full">
              Load more history
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
