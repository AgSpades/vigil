import { streamText, tool, stepCountIs } from "ai";
import { model } from "../groq";
import { z } from "zod";
import { saveStagedAction } from "../db/staged-actions";
import { saveContactContext } from "../db/contact-context";
import { logAudit } from "../db/audit";
import type { ModelMessage } from "ai";

const SYSTEM_PROMPT = `
You are Vigil's setup assistant. Your job is to help the user configure what
happens when Vigil activates — when their check-ins stop.

You must extract the following from the conversation:
- Who should be contacted, how, and after how much silence time
- Any relationship context the user shares about each contact
- Any file archiving or repository transfer wishes

For every action, normalize timing to triggerMinutes (integer minutes).
Examples:
- 10 minutes -> triggerMinutes: 10
- 2 hours -> triggerMinutes: 120
- 7 days -> triggerMinutes: 10080

Ask clarifying questions when the user is ambiguous. Be warm but concise.
Once you have enough information, confirm the full plan back to the user
in plain English before saving anything.

Only call saveAction and saveContact AFTER the user explicitly confirms.

For gmail_send actions, you must show the user an exact email preview before
asking for confirmation. The preview must include:
- recipient
- subject
- body

The subject and body must be based on the user's instruction and relationship
context. Stay faithful to what the user asked for:
- do not invent major new details
- do not add dramatic language the user did not ask for
- do not leave subject or body blank

If the user has not provided enough information to produce a faithful subject
and body preview, ask a follow-up question before confirming anything.

When you present a gmail_send preview, format it clearly like:
Email preview:
To: ...
Subject: ...
Body:
...

Then ask for confirmation. Do not save the action until the user explicitly
approves that preview.

Available services the user can connect: Gmail, Google Drive, GitHub.
Do not suggest services the user has not connected yet.
`;

export function createSetupChatHandler(
  userId: string,
  connectedServices: string[],
) {
  return async (messages: ModelMessage[]) => {
    return streamText({
      model,
      system:
        SYSTEM_PROMPT +
        `\nConnected services: ${connectedServices.length ? connectedServices.join(", ") : "none yet"}`,
      messages,
      tools: {
        // Tool: save a confirmed staged action to DB
        saveAction: tool({
          description:
            "Save a confirmed staged action to the database. Only call after user confirms.",
          inputSchema: z.object({
            triggerMinutes: z
              .number()
              .int()
              .positive()
              .optional()
              .describe("Minutes of silence before this action fires"),
            triggerHours: z
              .number()
              .positive()
              .optional()
              .describe(
                "Hours of silence before this action fires (legacy alternative)",
              ),
            triggerDays: z
              .number()
              .positive()
              .optional()
              .describe("Days of silence before this action fires"),
            actionType: z.enum([
              "gmail_send",
              "drive_archive",
              "github_transfer",
              "webhook",
            ]),
            actionConfig: z
              .object({
                to: z.string().optional(),
                subject: z.string().optional(),
                body: z.string().optional(),
                tone: z.string().optional(),
                relationship: z.string().optional(),
                targetEmail: z.string().optional(),
                target_email: z.string().optional(),
                repo: z.string().optional(),
                newOwner: z.string().optional(),
                new_owner: z.string().optional(),
                url: z.string().optional(),
              })
              .passthrough()
              .describe("Structured config for this action type"),
          }),
          execute: async ({
            triggerMinutes,
            triggerHours,
            triggerDays,
            actionType,
            actionConfig,
          }) => {
            const normalizedActionConfig =
              actionConfig && typeof actionConfig === "object"
                ? (actionConfig as Record<string, unknown>)
                : {};

            if (actionType === "gmail_send") {
              const to =
                typeof normalizedActionConfig.to === "string"
                  ? normalizedActionConfig.to.trim()
                  : "";
              const subject =
                typeof normalizedActionConfig.subject === "string"
                  ? normalizedActionConfig.subject.trim()
                  : "";
              const body =
                typeof normalizedActionConfig.body === "string"
                  ? normalizedActionConfig.body.trim()
                  : "";

              if (!to || !subject || !body) {
                throw new Error(
                  "gmail_send actions must include recipient, subject, and body before saving",
                );
              }
            }

            const resolvedTriggerMinutes = Math.max(
              1,
              Math.round(
                triggerMinutes ??
                  ((triggerHours ?? 0) * 60 || (triggerDays ?? 0) * 1_440),
              ),
            );

            const savedAction = await saveStagedAction({
              userId,
              triggerMinutes: resolvedTriggerMinutes,
              actionType,
              actionConfig: {
                ...normalizedActionConfig,
                triggerMinutes: resolvedTriggerMinutes,
              },
            });

            await logAudit(userId, "setup_action_saved", {
              actionId: savedAction.id,
              triggerMinutes: resolvedTriggerMinutes,
              actionType,
            });

            return { saved: true };
          },
        }),

        // Tool: save contact relationship context for LLM drafting later
        saveContact: tool({
          description:
            "Save relationship context for a contact. Used to draft personalized messages at activation.",
          inputSchema: z.object({
            contactName: z.string(),
            contactEmail: z.string().optional(),
            relationship: z.string().describe("e.g. sister, mentor, colleague"),
            context: z
              .string()
              .describe("User's own words about this person and what to say"),
          }),
          execute: async ({
            contactName,
            contactEmail,
            relationship,
            context,
          }) => {
            await saveContactContext({
              userId,
              contactName,
              contactEmail,
              relationship,
              context,
            });

            await logAudit(userId, "setup_contact_saved", {
              contactName,
              contactEmail,
              relationship,
            });

            return { saved: true };
          },
        }),

        // Tool: mark setup as confirmed in audit log
        confirmSetup: tool({
          description:
            "Call this when the user has confirmed their full plan and all actions are saved.",
          inputSchema: z.object({
            summary: z
              .string()
              .describe("One-sentence summary of what was configured"),
          }),
          execute: async ({ summary }) => {
            await logAudit(userId, "setup_confirmed", { summary });
            return { confirmed: true };
          },
        }),
      },
      stopWhen: stepCountIs(10),
    });
  };
}
