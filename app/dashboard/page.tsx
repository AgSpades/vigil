import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getVigilConfig, upsertUser, ensureVigilConfig } from "@/lib/db/users";
import { getLastHeartbeat } from "@/lib/db/heartbeats";
import { getStagedActions } from "@/lib/db/staged-actions";
import { HeartbeatButton } from "@/components/HeartbeatButton";
import { AuditLog } from "@/components/AuditLog";
import Link from "next/link";

function getStatusLabel(config: {
  activatedAt: Date | null;
  cancelledAt: Date | null;
  cibaSentAt: Date | null;
} | null): { label: string; color: string; dot: string } {
  if (!config) return { label: "NOT SET UP", color: "text-zinc-500", dot: "bg-zinc-500" };
  if (config.activatedAt) return { label: "ACTIVATED", color: "text-rose-400", dot: "bg-rose-400" };
  if (config.cancelledAt) return { label: "STANDING DOWN", color: "text-zinc-400", dot: "bg-zinc-400" };
  if (config.cibaSentAt) return { label: "ALERT SENT", color: "text-amber-400 animate-pulse", dot: "bg-amber-400 animate-ping" };
  return { label: "WATCHING", color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" };
}

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const userId = session.user.sub;
  const email = session.user.email ?? "";

  await upsertUser(userId, email);
  await ensureVigilConfig(userId);

  const [config, lastBeat, actions] = await Promise.all([
    getVigilConfig(userId),
    getLastHeartbeat(userId),
    getStagedActions(userId),
  ]);

  const status = getStatusLabel(config);
  const silenceDays = config?.silenceDays ?? 7;
  const lastBeatMs = lastBeat.getTime();
  const now = Date.now();
  const hoursSince =
    lastBeatMs === 0 ? null : Math.floor((now - lastBeatMs) / 3_600_000);

  const pendingActions = actions.filter((a) => a.status === "pending");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-zinc-100 tracking-tight">Vigil</span>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/setup"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Setup
          </Link>
          <Link
            href="/dashboard/connect"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Connect
          </Link>
          <a
            href="/auth/logout"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Sign out
          </a>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-12">
        {/* Status */}
        <section className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className={`inline-block w-3 h-3 rounded-full ${status.dot}`} />
            <span className={`text-2xl font-bold tracking-widest ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-zinc-500 text-sm">
            {hoursSince === null
              ? "No check-ins recorded yet"
              : hoursSince === 0
                ? "Last check-in: less than an hour ago"
                : `Last check-in: ${hoursSince} hour${hoursSince === 1 ? "" : "s"} ago`}
            {config && ` · Threshold: ${silenceDays} days`}
          </p>
          <div className="flex justify-center pt-2">
            <HeartbeatButton />
          </div>
        </section>

        {/* Configured actions */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Configured Actions
          </h2>
          {pendingActions.length === 0 ? (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-500 text-center">
              No actions configured yet.{" "}
              <Link href="/dashboard/setup" className="text-zinc-300 underline">
                Set up Vigil
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200 capitalize">
                      {action.actionType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      After {action.triggerDays} days of silence
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border border-zinc-700 text-zinc-400">
                    {action.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audit log */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Audit Log
          </h2>
          <AuditLog />
        </section>
      </main>
    </div>
  );
}
