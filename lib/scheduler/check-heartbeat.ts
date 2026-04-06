import { getLastHeartbeat } from "../db/heartbeats";
import { getVigilConfig, updateCibaSentAt } from "../db/users";
import { logAudit } from "../db/audit";
import { triggerActivation } from "../agent/executor";

/**
 * Sends a CIBA push to the user via Auth0 Management API.
 * This is a direct API call — not an AI tool wrapper — because the scheduler
 * runs outside of any agent tool context.
 */
async function sendCIBAPush(userId: string, silenceDays: number) {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!;
  const audience = process.env.AUTH0_AUDIENCE!;

  // Get management API token
  const tokenRes = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!tokenRes.ok) {
    console.error("Failed to get management token for CIBA push");
    return;
  }
  const { access_token: mgmtToken } = (await tokenRes.json()) as {
    access_token: string;
  };

  // Initiate CIBA request
  const cibaRes = await fetch(`https://${domain}/bc-authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${mgmtToken}`,
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "openid",
      audience,
      login_hint: JSON.stringify({
        format: "iss_sub",
        iss: `https://${domain}/`,
        sub: userId,
      }),
      binding_message: `Vigil: no check-in for ${Math.floor(silenceDays)} days. Approve to execute your instructions, or cancel to stand down.`,
    }),
  });

  if (!cibaRes.ok) {
    const body = await cibaRes.text();
    console.error("CIBA push failed:", body);
  }
}

export async function checkHeartbeat(userId: string) {
  const config = await getVigilConfig(userId);

  // Skip users who are already activated or have cancelled
  if (!config || config.activatedAt || config.cancelledAt) return;

  const lastBeat = await getLastHeartbeat(userId);
  // lastBeat will be null if the user has never checked in — treat that as silenceDays = Infinity, which will trigger the CIBA push immediately. Otherwise, calculate silenceDays as normal.
  if (!lastBeat) return;
  
  const silenceDays = (Date.now() - lastBeat.getTime()) / 86_400_000;

  // Still within threshold — nothing to do
  if (silenceDays < config.silenceDays) return;

  if (!config.cibaSentAt) {
    // First time crossing threshold — send CIBA push and record timestamp
    await sendCIBAPush(userId, silenceDays);
    await updateCibaSentAt(userId);
    await logAudit(userId, "ciba_sent", { silenceDays });
    return;
  }

  // CIBA was already sent — check if grace window has elapsed
  const graceElapsed =
    Date.now() - config.cibaSentAt.getTime() > config.graceHours * 3_600_000;

  if (graceElapsed) {
    // User did not respond — hand off to the LLM activation agent
    await triggerActivation(userId, silenceDays);
  }
}
