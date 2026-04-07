import { generateText, tool, stepCountIs } from "ai";
import { model } from "../groq";
import { z } from "zod";
import {
  getPendingStagedActions,
  markActionExecuted,
  markActionFailed,
} from "../db/staged-actions";
import { getContactContext } from "../db/contact-context";
import { logAudit } from "../db/audit";
import { markActivated } from "../db/users";
import {
  auth0AI,
  getAccessTokenFromTokenVault,
  GOOGLE_GMAIL_SCOPES,
  GOOGLE_DRIVE_SCOPES,
  GITHUB_SCOPES,
} from "../auth0-ai";
import { auth0 } from "../auth0";

async function getRefreshToken(): Promise<string | undefined> {
  const session = await auth0.getSession();
  return session?.tokenSet?.refreshToken ?? undefined;
}

export async function triggerActivation(
  userId: string,
  elapsedMinutes: number,
) {
  const actions = await getPendingStagedActions(userId, elapsedMinutes);
  const contacts = await getContactContext(userId);

  if (actions.length === 0) return;

  await markActivated(userId);

  const actionsDescription = actions
    .map(
      (a: (typeof actions)[number]) =>
        `- Action ID ${a.id}: ${a.actionType} | config: ${JSON.stringify(a.actionConfig)}`,
    )
    .join("\n");

  const contactsDescription = contacts
    .map(
      (c: (typeof contacts)[number]) =>
        `- ${c.contactName} (${c.relationship}): ${c.context}`,
    )
    .join("\n");

  const gmailTool = auth0AI.withTokenVault(
    {
      connection: process.env.GOOGLE_CONNECTION_NAME!,
      scopes: GOOGLE_GMAIL_SCOPES,
      refreshToken: getRefreshToken,
    },
    tool({
      description:
        "Draft and send an email via Gmail using Token Vault credentials.",
      inputSchema: z.object({
        actionId: z.number(),
        to: z.string(),
        subject: z.string(),
        body: z
          .string()
          .describe("Fully drafted email body — personalized, not a template"),
      }),
      execute: async ({ actionId, to, subject, body }) => {
        try {
          const accessToken = getAccessTokenFromTokenVault();
          const raw = btoa(
            `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain\r\n\r\n${body}`,
          )
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

          const res = await fetch(
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
          if (!res.ok) throw new Error(`Gmail error: ${res.status}`);
          await markActionExecuted(actionId);
          await logAudit(userId, "action_executed", { actionId, to });
          return { ok: true };
        } catch (err) {
          await markActionFailed(actionId);
          await logAudit(userId, "action_failed", {
            actionId,
            error: String(err),
          });
          return { ok: false, error: String(err) };
        }
      },
    }),
  );

  const githubTool = auth0AI.withTokenVault(
    {
      connection: process.env.GITHUB_CONNECTION_NAME!,
      scopes: GITHUB_SCOPES,
      refreshToken: getRefreshToken,
    },
    tool({
      description:
        "Transfer a GitHub repository to a new owner via Token Vault credentials.",
      inputSchema: z.object({
        actionId: z.number(),
        repo: z.string().describe("owner/repo-name"),
        newOwner: z.string().describe("GitHub username of heir"),
      }),
      execute: async ({ actionId, repo, newOwner }) => {
        try {
          const accessToken = getAccessTokenFromTokenVault();
          const res = await fetch(
            `https://api.github.com/repos/${repo}/transfer`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
              },
              body: JSON.stringify({ new_owner: newOwner }),
            },
          );
          if (!res.ok) throw new Error(`GitHub error: ${res.status}`);
          await markActionExecuted(actionId);
          await logAudit(userId, "action_executed", {
            actionId,
            repo,
            newOwner,
          });
          return { ok: true };
        } catch (err) {
          await markActionFailed(actionId);
          await logAudit(userId, "action_failed", {
            actionId,
            error: String(err),
          });
          return { ok: false, error: String(err) };
        }
      },
    }),
  );

  const driveTool = auth0AI.withTokenVault(
    {
      connection: process.env.GOOGLE_CONNECTION_NAME!,
      scopes: GOOGLE_DRIVE_SCOPES,
      refreshToken: getRefreshToken,
    },
    tool({
      description:
        "Archive Google Drive files to a shared folder via Token Vault credentials.",
      inputSchema: z.object({
        actionId: z.number(),
        targetEmail: z
          .string()
          .describe("Email to share the archive folder with"),
      }),
      execute: async ({ actionId, targetEmail }) => {
        try {
          const accessToken = getAccessTokenFromTokenVault();

          const folderRes = await fetch(
            "https://www.googleapis.com/drive/v3/files",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Vigil Archive",
                mimeType: "application/vnd.google-apps.folder",
              }),
            },
          );
          if (!folderRes.ok)
            throw new Error(`Drive folder error: ${folderRes.status}`);
          const folder = (await folderRes.json()) as { id: string };

          await fetch(
            `https://www.googleapis.com/drive/v3/files/${folder.id}/permissions`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                role: "reader",
                type: "user",
                emailAddress: targetEmail,
              }),
            },
          );

          await markActionExecuted(actionId);
          await logAudit(userId, "action_executed", {
            actionId,
            folderId: folder.id,
          });
          return { ok: true, folderId: folder.id };
        } catch (err) {
          await markActionFailed(actionId);
          await logAudit(userId, "action_failed", {
            actionId,
            error: String(err),
          });
          return { ok: false, error: String(err) };
        }
      },
    }),
  );

  await generateText({
    model,
    system: `
You are Vigil's activation agent. The user has been silent for ${Math.round(elapsedMinutes)} minutes (${(elapsedMinutes / 60).toFixed(1)} hours).
You must now execute their pre-configured wishes in order.

For Gmail actions: draft a warm, personalized farewell message using the
relationship context provided. Match the tone the user described. Do not
use generic templates.

Execute actions in order of triggerMinutes (ascending). If one fails, log it
and continue with the rest. Never stop the entire sequence for one failure.
    `,
    prompt: `
Pending actions:
${actionsDescription}

Contact relationship context:
${contactsDescription || "No contact context provided."}

Execute each action now using the available tools.
    `,
    tools: {
      sendGmail: gmailTool,
      transferGithubRepo: githubTool,
      archiveDrive: driveTool,
    },
    stopWhen: stepCountIs(20),
  });
}
