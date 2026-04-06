import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { HeartbeatButton } from "@/components/HeartbeatButton";
import {
  CONNECTED_SERVICES,
  type ConnectedServiceDefinition,
} from "@/lib/auth0-connected-accounts";
import { getAuditLogs } from "@/lib/db/audit";
import { getLastHeartbeat } from "@/lib/db/heartbeats";
import { getStagedActions } from "@/lib/db/staged-actions";
import {
  ensureVigilConfig,
  getConnectedServices,
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
      typeof config.subject === "string" ? ` with subject "${config.subject}"` : "";
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

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" • ");
}

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) {
    return null;
  }

  await upsertUser(session.user.sub, session.user.email ?? "");
  await ensureVigilConfig(session.user.sub);

  const [config, lastHeartbeat, actions, connected, auditLogs] =
    await Promise.all([
      getVigilConfig(session.user.sub),
      getLastHeartbeat(session.user.sub),
      getStagedActions(session.user.sub),
      getConnectedServices(session.user.sub),
      getAuditLogs(session.user.sub, 25),
    ]);

  const lastSeen = getLastHeartbeatOrNull(lastHeartbeat);
  const connectedServices = CONNECTED_SERVICES.filter((service) =>
    connected.includes(service.id),
  );

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

          <div className="flex flex-col gap-3">
            {actions.length > 0 ? (
              actions.map((action: Awaited<ReturnType<typeof getStagedActions>>[number]) => (
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
                  <span className="px-2 py-1 bg-vigil-bgTer border border-vigil-borderSubtle text-[11px] text-vigil-textSec rounded-[2px] shrink-0 uppercase tracking-[0.08em]">
                    {action.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-vigil-bgSec border border-dashed border-vigil-borderSubtle rounded-[4px] px-5 py-8 text-center text-[13px] text-vigil-textSec">
                No instructions saved yet.
              </div>
            )}
          </div>

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

          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            {connectedServices.length > 0 ? (
              connectedServices.map((service: ConnectedServiceDefinition) => (
                <div
                  key={service.id}
                  className="w-full sm:w-[220px] flex-shrink-0 bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px] p-5 relative overflow-hidden"
                >
                  <div className="flex flex-col gap-3 z-10 relative">
                    <span className="text-[14px] font-medium text-vigil-textPri break-words min-w-0">
                      {service.name}
                    </span>
                    <span className="text-[12px] text-vigil-textTer">
                      {service.description}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-vigil-statusWatch font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-vigil-statusWatch animate-pulseWatch"></span>
                      Connected
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full bg-vigil-bgSec border border-dashed border-vigil-borderSubtle rounded-[4px] p-6 text-center text-[12px] text-vigil-textSec uppercase tracking-[0.1em]">
                No connected services yet.
              </div>
            )}
          </div>

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

          <div className="flex flex-col border-t border-vigil-borderSubtle">
            {auditLogs.length > 0 ? (
              auditLogs.map((log: Awaited<ReturnType<typeof getAuditLogs>>[number]) => (
                <div
                  key={log.id}
                  className="py-4 border-b border-vigil-borderSubtle flex flex-col gap-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-vigil-accentPri"></div>
                      <span className="text-[13px] text-vigil-textPri break-words min-w-0">
                        {log.eventType.replaceAll("_", " ")}
                      </span>
                    </div>
                    <span className="text-[12px] font-mono text-vigil-textTer shrink-0">
                      {formatTimestamp(log.occurredAt)}
                    </span>
                  </div>

                  {formatAuditDetail(log.detail) && (
                    <p className="text-[12px] text-vigil-textSec pl-5">
                      {formatAuditDetail(log.detail)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-[13px] text-vigil-textSec">
                No events yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
