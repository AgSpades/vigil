import { getLastHeartbeat } from "../db/heartbeats";
import { getVigilConfig, markCancelled, updateCibaSentAt } from "../db/users";
import { getLatestCibaAuthRequestId, logAudit } from "../db/audit";
import { triggerActivation } from "../agent/executor";
import { cancelAllActions } from "../db/staged-actions";

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
    return null;
  }

  const payload = (await cibaRes.json()) as {
    auth_req_id?: string;
    expires_in?: number;
    interval?: number;
  };

  if (!payload.auth_req_id) {
    return null;
  }

  return {
    authReqId: payload.auth_req_id,
    expiresIn: payload.expires_in ?? null,
    interval: payload.interval ?? null,
  };
}

async function pollCibaDecision(
  authReqId: string,
): Promise<"approved" | "denied" | "pending" | "unknown"> {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!;
  const audience = process.env.AUTH0_AUDIENCE!;

  const tokenRes = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:openid:params:grant-type:ciba",
      client_id: clientId,
      client_secret: clientSecret,
      auth_req_id: authReqId,
      audience,
    }),
  });

  if (tokenRes.ok) {
    return "approved";
  }

  const payload = (await tokenRes.json().catch(() => ({}))) as {
    error?: string;
  };

  if (
    payload.error === "authorization_pending" ||
    payload.error === "slow_down"
  ) {
    return "pending";
  }

  if (payload.error === "access_denied") {
    return "denied";
  }

  if (payload.error === "expired_token") {
    return "pending";
  }

  return "unknown";
}

export async function checkHeartbeat(userId: string) {
  const config = await getVigilConfig(userId);

  // Skip users who are already activated or have cancelled
  if (!config || config.activatedAt || config.cancelledAt) return;

  const lastBeat = await getLastHeartbeat(userId);
  // lastBeat will be null if the user has never checked in — treat that as silenceDays = Infinity, which will trigger the CIBA push immediately. Otherwise, calculate silenceDays as normal.
  if (!lastBeat) return;

  const elapsedMinutes = (Date.now() - lastBeat.getTime()) / 60_000;
  const silenceDays = elapsedMinutes / 1_440;

  // Still within threshold — nothing to do
  if (elapsedMinutes < config.silenceDays * 1_440) return;

  if (!config.cibaSentAt) {
    // First time crossing threshold — send CIBA push and record timestamp
    const cibaRequest = await sendCIBAPush(userId, silenceDays);
    await updateCibaSentAt(userId);
    await logAudit(userId, "ciba_sent", {
      silenceDays,
      authReqId: cibaRequest?.authReqId,
      expiresInSeconds: cibaRequest?.expiresIn,
      pollIntervalSeconds: cibaRequest?.interval,
    });
    return;
  }

  // Poll CIBA decision before grace timeout to respect explicit user deny/approve.
  const authReqId = await getLatestCibaAuthRequestId(userId);
  if (authReqId) {
    const decision = await pollCibaDecision(authReqId);

    if (decision === "denied") {
      await markCancelled(userId);
      const cancelledCount = await cancelAllActions(userId);
      await logAudit(userId, "ciba_denied", {
        cancelledPendingActions: cancelledCount,
      });
      await logAudit(userId, "agent_cancelled", {
        reason: "user_denied_ciba",
        cancelledPendingActions: cancelledCount,
      });
      return;
    }

    if (decision === "approved") {
      await logAudit(userId, "ciba_approved", {
        elapsedMinutes,
      });
      await triggerActivation(userId, elapsedMinutes);
      return;
    }
  }

  // CIBA was already sent — check if grace window has elapsed
  const graceElapsed =
    Date.now() - config.cibaSentAt.getTime() > config.graceHours * 3_600_000;

  if (graceElapsed) {
    // User did not respond — hand off to the LLM activation agent
    await triggerActivation(userId, elapsedMinutes);
  }
}
