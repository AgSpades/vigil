import { auth0 } from "@/lib/auth0";
import { recordHeartbeat } from "@/lib/db/heartbeats";
import { logAudit } from "@/lib/db/audit";
import { upsertUser, ensureVigilConfig } from "@/lib/db/users";

export async function POST() {
  const session = await auth0.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.sub;
  const email = session.user.email ?? "";

  await upsertUser(userId, email);
  await ensureVigilConfig(userId);
  await recordHeartbeat(userId);
  await logAudit(userId, "heartbeat", {});

  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
