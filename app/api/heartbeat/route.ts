import { auth0 } from "@/lib/auth0";
import { logAudit } from "@/lib/db/audit";
import { recordHeartbeat } from "@/lib/db/heartbeats";
import {
  ensureVigilConfig,
  isSecureCheckinSchemaReady,
  markCheckinSuccess,
  upsertUser,
} from "@/lib/db/users";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.sub;
  const email = session.user.email ?? "";
  const source = request.headers.get("x-checkin-source") ?? "browser";

  await upsertUser(userId, email);
  await ensureVigilConfig(userId);
  await recordHeartbeat(userId);

  const secureSchemaReady = await isSecureCheckinSchemaReady();
  if (secureSchemaReady) {
    await markCheckinSuccess(userId);
  }

  await logAudit(userId, "heartbeat", {
    source,
    mode: "lightweight",
  });

  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
