import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { HeartbeatButton } from "@/components/HeartbeatButton";
import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import { LiveAuditLog } from "@/components/LiveAuditLog";
import { StagedActionsList } from "@/components/StagedActionsList";
import {
  CONNECTED_SERVICES,
} from "@/lib/auth0-connected-accounts";
import { fetchConnectedAccounts } from "@/lib/auth0-my-account";
import { getAuditLogs } from "@/lib/db/audit";
import { getLastHeartbeat } from "@/lib/db/heartbeats";
import { getStagedActions } from "@/lib/db/staged-actions";
import {
  ensureVigilConfig,
  getVigilConfig,
  upsertUser,
} from "@/lib/db/users";

function formatTimestamp(date: Date | null): string {
  if (!date) {
    return "No check-in recorded yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getLastHeartbeatOrNull(date: Date): Date | null {
  return date.getTime() === 0 ? null : date;
}

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) {
    return null;
  }

  await upsertUser(session.user.sub, session.user.email ?? "");
  await ensureVigilConfig(session.user.sub);

  const [config, lastHeartbeat, actions, auditLogs, accounts] =
    await Promise.all([
      getVigilConfig(session.user.sub),
      getLastHeartbeat(session.user.sub),
      getStagedActions(session.user.sub),
      getAuditLogs(session.user.sub, 25),
      fetchConnectedAccounts({
        probeConnections: Array.from(
          new Set(CONNECTED_SERVICES.map((service) => service.connectionName)),
        ),
      }),
    ]);

  const lastSeen = getLastHeartbeatOrNull(lastHeartbeat);

  const statusKey = config?.cancelledAt
    ? "down"
    : config?.activatedAt
      ? "activated"
      : config?.cibaSentAt
        ? "alert"
        : "watching";

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
    activated: {
      text: "Vigil is executing your plan.",
      pillText: "ACTIVATED",
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
  } as const;

  const status = statusMap[statusKey];

  return (
    <main className="min-h-[calc(100vh-72px)] bg-vigil-bgPri p-6 md:p-12 text-vigil-textPri flex justify-center fade-up relative pb-[120px]">
      <div className="w-full max-w-[800px] flex flex-col gap-[80px]">
        <section className="flex flex-col gap-6 items-start">
          <div
            className={`px-3 py-1 flex items-center gap-2 rounded-[2px] transition-colors duration-500 delay-100 ${status.pillClass}`}
          >
            <div className={`w-2 h-2 rounded-full ${status.dotClass}`} />
            <span className="text-[11px] font-sans uppercase tracking-[0.14em]">
              {status.pillText}
            </span>
          </div>

          <h1 className="font-serif text-[40px] md:text-[56px] font-light leading-[1.1]">
            {status.text}
          </h1>

          <div className="flex flex-col gap-2 text-vigil-textSec font-mono text-[13px]">
            <p>Last seen — {formatTimestamp(lastSeen)}</p>
            {config && (
              <p>
                Threshold — {config.silenceDays} day(s), grace window —{" "}
                {config.graceHours} hour(s)
              </p>
            )}
          </div>

          <HeartbeatButton />
        </section>

        <section className="flex flex-col gap-6 fade-up delay-100">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              YOUR INSTRUCTIONS
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <StagedActionsList initialActions={actions} />

          <div className="flex">
            <Link href="/dashboard/setup" className="py-2 pr-4 -my-2 flex">
              <span className="text-[12px] uppercase text-vigil-textSec hover:text-vigil-accentPri border-b border-transparent hover:border-vigil-accentPri transition-colors pb-1">
                Edit instructions
              </span>
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-6 fade-up delay-200">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              CONNECTED SERVICES
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <ConnectedAccounts initialAccounts={accounts} returnTo="/dashboard" />

          <div className="flex">
            <Link href="/dashboard/connect" className="py-2 pr-4 -my-2 flex">
              <span className="text-[12px] uppercase text-vigil-textSec hover:text-vigil-accentPri border-b border-transparent hover:border-vigil-accentPri transition-colors pb-1">
                Manage connections
              </span>
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-6 fade-up delay-300">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              AUDIT LOG
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <LiveAuditLog initialLogs={auditLogs} />
        </section>
      </div>
    </main>
  );
}
