import { auth0 } from "@/lib/auth0";
import { checkHeartbeat } from "@/lib/scheduler/check-heartbeat";
import { ensureVigilConfig, upsertUser } from "@/lib/db/users";

export async function POST() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.sub;
  const email = session.user.email ?? "";

  await upsertUser(userId, email);
  const config = await ensureVigilConfig(userId);

  if (!config.demoMode) {
    return Response.json({ error: "Demo mode is disabled" }, { status: 409 });
  }

  const refreshToken = session.tokenSet?.refreshToken;
  if (!refreshToken) {
    return Response.json(
      {
        error:
          "Missing Auth0 refresh token for demo execution. Sign out and sign back in, then reconnect Gmail if needed.",
      },
      { status: 400 },
    );
  }

  await checkHeartbeat(userId, { demoRefreshToken: refreshToken });

  return Response.json({ ok: true });
}
