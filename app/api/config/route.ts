import { auth0 } from "@/lib/auth0";
import {
  ensureVigilConfig,
  getVigilConfig,
  resetVigilState,
  updateDemoMode,
} from "@/lib/db/users";
import { logAudit } from "@/lib/db/audit";
import { getLastHeartbeat, recordHeartbeat } from "@/lib/db/heartbeats";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureVigilConfig(session.user.sub);
  const config = await getVigilConfig(session.user.sub);
  return Response.json({ config });
}

export async function PATCH(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { demoMode?: unknown };
  if (typeof body.demoMode !== "boolean") {
    return Response.json(
      { error: "demoMode must be a boolean" },
      { status: 400 },
    );
  }

  await ensureVigilConfig(session.user.sub);
  if (body.demoMode) {
    await resetVigilState(session.user.sub);
  }

  const updated = await updateDemoMode(session.user.sub, body.demoMode);

  if (body.demoMode) {
    const lastHeartbeat = await getLastHeartbeat(session.user.sub);
    if (!lastHeartbeat) {
      await recordHeartbeat(session.user.sub);
      await logAudit(session.user.sub, "demo_mode_seeded_heartbeat", {});
    }
  }

  await logAudit(session.user.sub, "demo_mode_updated", {
    demoMode: updated.demoMode,
  });

  return Response.json({ config: updated });
}
