import {
  getPendingStagedActions,
  markActionExecuted,
  markActionFailed,
} from "../db/staged-actions";
import { getContactContext } from "../db/contact-context";
import { logAudit } from "../db/audit";
import { markActivated } from "../db/users";
import { GITHUB_SCOPES, GOOGLE_GMAIL_SCOPES } from "../auth0-ai";
import type { StagedAction } from "../db/types";

type ActionConfig = Record<string, unknown>;

async function exchangeTokenVaultAccessToken(params: {
  refreshToken?: string;
  connection: string;
  scopes: string[];
}): Promise<string> {
  if (!params.refreshToken) {
    throw new Error("Missing refresh token for Token Vault exchange");
  }

  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Missing Auth0 environment variables for Token Vault exchange");
  }

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type:
        "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
      client_id: clientId,
      client_secret: clientSecret,
      subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
      subject_token: params.refreshToken,
      connection: params.connection,
      requested_token_type:
        "http://auth0.com/oauth/token-type/federated-connection-access-token",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token Vault exchange failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    scope?: string;
  };

  const grantedScopes = (payload.scope ?? "").replace(/,/g, " ").split(" ");
  const requiredScopes = params.scopes;
  const actuallyMissingScopes = requiredScopes.filter(
    (scope) => !grantedScopes.includes(scope),
  );

  if (!payload.access_token) {
    throw new Error("Token Vault exchange did not return an access token");
  }

  if (actuallyMissingScopes.length > 0) {
    throw new Error(
      `Token Vault exchange missing scopes: ${actuallyMissingScopes.join(", ")}`,
    );
  }

  return payload.access_token;
}

function buildDeterministicEmailBody(
  actionConfig: ActionConfig,
  contacts: Awaited<ReturnType<typeof getContactContext>>,
): string {
  if (typeof actionConfig.body === "string" && actionConfig.body.trim().length > 0) {
    return actionConfig.body;
  }

  const targetEmail =
    typeof actionConfig.to === "string" ? actionConfig.to.toLowerCase() : null;
  const matchingContact = targetEmail
    ? contacts.find(
        (contact) => contact.contactEmail?.toLowerCase() === targetEmail,
      )
    : null;

  if (matchingContact?.context) {
    return matchingContact.context;
  }

  return "This message was sent by Vigil based on a pre-configured instruction.";
}

function buildDeterministicEmailSubject(actionConfig: ActionConfig): string {
  if (
    typeof actionConfig.subject === "string" &&
    actionConfig.subject.trim().length > 0
  ) {
    return actionConfig.subject;
  }

  return "A message from Vigil";
}

async function executeGmailAction(params: {
  userId: string;
  action: StagedAction;
  contacts: Awaited<ReturnType<typeof getContactContext>>;
  refreshToken?: string;
}): Promise<void> {
  const actionConfig =
    params.action.actionConfig && typeof params.action.actionConfig === "object"
      ? (params.action.actionConfig as ActionConfig)
      : {};

  const to =
    typeof actionConfig.to === "string" ? actionConfig.to.trim() : undefined;

  if (!to) {
    throw new Error("gmail_send action is missing a recipient email");
  }

  const accessToken = await exchangeTokenVaultAccessToken({
    refreshToken: params.refreshToken,
    connection: process.env.GOOGLE_CONNECTION_NAME!,
    scopes: GOOGLE_GMAIL_SCOPES,
  });

  const subject = buildDeterministicEmailSubject(actionConfig);
  const body = buildDeterministicEmailBody(actionConfig, params.contacts);
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`,
    "utf8",
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gmail error: ${response.status} ${errorBody}`);
  }

  await markActionExecuted(params.action.id);
  await logAudit(params.userId, "action_executed", {
    actionId: params.action.id,
    actionType: params.action.actionType,
    to,
    subject,
  });
}

async function executeGithubTransferAction(params: {
  userId: string;
  action: StagedAction;
  refreshToken?: string;
}): Promise<void> {
  const actionConfig =
    params.action.actionConfig && typeof params.action.actionConfig === "object"
      ? (params.action.actionConfig as ActionConfig)
      : {};

  const repo =
    typeof actionConfig.repo === "string" ? actionConfig.repo.trim() : undefined;
  const newOwner =
    typeof actionConfig.newOwner === "string"
      ? actionConfig.newOwner.trim()
      : typeof actionConfig.new_owner === "string"
        ? actionConfig.new_owner.trim()
        : undefined;

  if (!repo) {
    throw new Error("github_transfer action is missing a repo");
  }

  if (!newOwner) {
    throw new Error("github_transfer action is missing a new owner");
  }

  const accessToken = await exchangeTokenVaultAccessToken({
    refreshToken: params.refreshToken,
    connection: process.env.GITHUB_CONNECTION_NAME!,
    scopes: GITHUB_SCOPES,
  });

  const response = await fetch(`https://api.github.com/repos/${repo}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ new_owner: newOwner }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub transfer failed: ${response.status} ${errorBody}`);
  }

  await markActionExecuted(params.action.id);
  await logAudit(params.userId, "action_executed", {
    actionId: params.action.id,
    actionType: params.action.actionType,
    repo,
    newOwner,
  });
}

async function executeDeterministicAction(params: {
  userId: string;
  action: StagedAction;
  contacts: Awaited<ReturnType<typeof getContactContext>>;
  refreshToken?: string;
}): Promise<void> {
  switch (params.action.actionType) {
    case "gmail_send":
      await executeGmailAction(params);
      return;
    case "github_transfer":
      await executeGithubTransferAction(params);
      return;
    default:
      throw new Error(
        `Deterministic execution is not implemented for ${params.action.actionType}`,
      );
  }
}

export async function triggerActivation(
  userId: string,
  elapsedMinutes: number,
  {
    isDemo = false,
    refreshToken,
  }: { isDemo?: boolean; refreshToken?: string } = {},
) {
  const actions = await getPendingStagedActions(userId, elapsedMinutes);
  const contacts = await getContactContext(userId);

  if (actions.length === 0) return;

  const getRefreshToken = async () => refreshToken;

  // In demo mode, don't permanently mark as activated so the user can test again.
  if (!isDemo) {
    await markActivated(userId);
  }

  let executedCount = 0;

  for (const action of actions) {
    try {
      await executeDeterministicAction({
        userId,
        action,
        contacts,
        refreshToken: await getRefreshToken(),
      });
      executedCount += 1;
    } catch (err) {
      await markActionFailed(action.id);
      await logAudit(userId, "action_failed", {
        actionId: action.id,
        actionType: action.actionType,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await logAudit(userId, "activation_agent_completed", {
    mode: "deterministic",
    executedCount,
    attemptedCount: actions.length,
  });

  const remainingActions = await getPendingStagedActions(userId, elapsedMinutes);
  if (remainingActions.length > 0) {
    await logAudit(userId, "activation_noop", {
      pendingActionIds: remainingActions.map((action) => action.id),
      mode: "deterministic",
    });
  }
}
